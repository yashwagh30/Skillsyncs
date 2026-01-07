import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { connectDB } from "./db";

// ============================
// Environment Variables
// ============================
const PORT = parseInt(process.env.PORT || "5008", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

const BACKEND_URL =
  process.env.BACKEND_URL || `http://localhost:${PORT}`;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3001";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this";

// ============================
// Connect DB
// ============================
connectDB();

// ============================
// Express App
// ============================
const app = express();

// ============================
// Middleware
// ============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// ✅ FIXED CORS (EC2 + Local)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server
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
// Passport Init
// ============================
app.use(passport.initialize());

// ============================
// Google OAuth Strategy
// ============================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error("No email found"), undefined);
        }

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

// ============================
// OAuth Routes
// ============================
app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req: any, res: Response) => {
    try {
      const token = jwt.sign(
        {
          userId: req.user.id,
          email: req.user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.redirect(
        `${FRONTEND_URL}/oauth-success?token=${encodeURIComponent(token)}`
      );
    } catch (err) {
      res.redirect(`${FRONTEND_URL}/login?error=oauth_callback_failed`);
    }
  }
);

// ============================
// App Bootstrap
// ============================
(async () => {
  try {
    const server = await registerRoutes(app);

    // Global Error Handler
    app.use(
      (err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || 500;
        const message = err.message || "Internal Server Error";
        console.error(err);
        res.status(status).json({ message });
      }
    );

    // API 404
    app.use("/api/*", (_req, res) => {
      res.status(404).json({ message: "API route not found" });
    });

    // ============================
    // Vite (dev) vs Static (prod)
    // ============================
    if (NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ============================
    // Listen
    // ============================
    server.listen(PORT, "0.0.0.0", () => {
      log(`✅ Server running on port ${PORT}`);
      log(`🌍 Backend URL: ${BACKEND_URL}`);
      log(`🖥️ Frontend URL: ${FRONTEND_URL}`);
      log(`🔐 JWT configured: ${!!process.env.JWT_SECRET}`);
      log(`🔐 Google OAuth: ${!!process.env.GOOGLE_CLIENT_ID}`);
    });
  } catch (error) {
    log(`❌ Failed to start server: ${error}`, "error");
    process.exit(1);
  }
})();
