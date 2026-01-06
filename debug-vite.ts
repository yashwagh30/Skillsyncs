
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    try {
        console.log("--- DEBUGGING VITE FILE CONTENT ---");

        const cjsPath = path.resolve(__dirname, "node_modules/vite/index.cjs");
        const esmPath = path.resolve(__dirname, "node_modules/vite/dist/node/index.js");

        if (fs.existsSync(cjsPath)) {
            console.log(`\n--- Content of index.cjs (${cjsPath}) ---`);
            const content = fs.readFileSync(cjsPath, "utf-8");
            console.log(content.slice(0, 500)); // Print first 500 chars
            console.log(`\n--- Total Size: ${content.length} bytes ---`);
        } else {
            console.log(`\n❌ index.cjs NOT FOUND at ${cjsPath}`);
        }

        if (fs.existsSync(esmPath)) {
            console.log(`\n--- Content of dist/node/index.js (${esmPath}) ---`);
            const content = fs.readFileSync(esmPath, "utf-8");
            console.log(content.slice(0, 500));
            console.log(`\n--- Total Size: ${content.length} bytes ---`);
        } else {
            console.log(`\n❌ dist/node/index.js NOT FOUND at ${esmPath}`);
        }

        // Try absolute require (bypass exports)
        try {
            const { createRequire } = await import("module");
            const require = createRequire(import.meta.url);
            console.log("\n--- Testing Absolute Require of index.cjs ---");
            const absReq = require(cjsPath);
            console.log("Keys:", Object.keys(absReq));
        } catch (e) {
            console.log("Absolute require failed:", e.message);
        }


        console.log("--- END DEBUG ---");
    } catch (err) {
        console.error("Global crash:", err);
    }
})();
