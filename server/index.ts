import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { storage } from "./storage";
import { connectDB } from "./db";

// Fix for ES Modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================
// ENV VALIDATION
// ============================
const PORT = parseInt(process.env.PORT || "5008", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!JWT_SECRET) throw new Error("❌ JWT_SECRET missing");
if (!GOOGLE_CLIENT_ID) throw new Error("❌ GOOGLE_CLIENT_ID missing");
if (!GOOGLE_CLIENT_SECRET) throw new Error("❌ GOOGLE_CLIENT_SECRET missing");

if (NODE_ENV === "production") {
  if (!BACKEND_URL) throw new Error("❌ BACKEND_URL missing");
  if (!FRONTEND_URL) throw new Error("❌ FRONTEND_URL missing");
}

// ============================
// CONNECT DATABASE
// ============================
connectDB();

// ============================
// EXPRESS APP
// ============================
const app = express();

// ============================
// MIDDLEWARE
// ============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// ✅ CORS (Local + EC2)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.startsWith("http://localhost") ||
        origin === FRONTEND_URL
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ============================
// PASSPORT & AUTH
// ============================
app.use(passport.initialize());

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        if (!profile.emails?.length) return done(new Error("No email from Google"), undefined);
        const email = profile.emails[0].value;
        let user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.createUser({
            email,
            password: "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            industry: null,
            experienceLevel: null,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }),
  (req: any, res: Response) => {
    try {
      const token = jwt.sign({ userId: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: "7d" });
      res.redirect(`${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`);
    } catch {
      res.redirect(`${FRONTEND_URL}/login?error=oauth_callback_failed`);
    }
  }
);

// ============================
// APP BOOTSTRAP
// ============================
(async () => {
  try {
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error(err);
      res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    });

    // API 404 (Must happen before static files catch-all)
    app.use("/api/*", (_req, res) => {
      res.status(404).json({ message: "API route not found" });
    });

    // ===============================================
    // ✅ CRITICAL FIX: STATIC FILE SERVING
    // ===============================================
    if (NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      // In Docker, files are in "dist/public".
      // Since this file is running from "dist/index.js", "public" is right next to it.
      const publicPath = path.join(__dirname, "public");
      
      app.use(express.static(publicPath));
      
      // Serve index.html for any unknown routes (React Router)
      app.get("*", (_req, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
      });
    }

    // START SERVER
    server.listen(PORT, "0.0.0.0", () => {
      log(`✅ Server running on port ${PORT}`);
      log(`🌍 Backend: ${BACKEND_URL}`);
      log(`🖥️ Frontend: ${FRONTEND_URL}`);
    });
  } catch (error) {
    log(`❌ Failed to start server: ${error}`, "error");
    process.exit(1);
  }
})();