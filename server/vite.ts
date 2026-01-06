import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Setup Vite dev server in middleware mode (DEV ONLY)
 */
export async function setupVite(app: Express, server: Server) {
  // Use createRequire for robust CJS/ESM interop
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);

  // Try to require the CJS entry point directly to bypass export map issues
  let vitePackage;
  try {
    const cjsPath = path.resolve(__dirname, "..", "node_modules", "vite", "index.cjs");
    if (fs.existsSync(cjsPath)) {
      vitePackage = require(cjsPath);
    } else {
      // Fallback if path structure is different
      vitePackage = require("vite");
    }
  } catch (e) {
    console.error("Failed to load vite via CJS path, falling back to require('vite'):", e);
    vitePackage = require("vite");
  }

  const createServer = vitePackage.createServer;

  if (!createServer) {
    console.error("❌ Failed to find createServer in vite module. Keys:", Object.keys(vitePackage || {}));
    throw new Error("Checking vite module exports failed");
  }

  const vite = await createServer({
    root: path.resolve(__dirname, "..", "client"),
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;

      const indexPath = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(indexPath, "utf-8");

      // Bust cache during dev
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
}

/**
 * Serve built frontend in production
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    log(`Build directory not found: ${distPath}`, "warn");
    return;
  }

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
