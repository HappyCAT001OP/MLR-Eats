import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { users } from "./schema";
import bcrypt from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import { eq } from "drizzle-orm";

// User type is defined globally in types/express/index.d.ts

export default function authRoutes(db: any) {
  // Passport local strategy
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) return done(null, false, { message: "Incorrect email or password" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return done(null, false, { message: "Incorrect email or password" });
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
      done(null, user);
    } catch (e) {
      done(e);
    }
  });

  const router = Router();

  // Register
  router.post("/register", async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!email.endsWith("@mlrit.ac.in")) {
      return res.status(400).json({ message: "Only @mlrit.ac.in emails allowed" });
    }
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({ name, email, password: hash, userType: "student" }).returning();
    req.login(user, err => {
      if (err) return res.status(500).json({ message: "Login failed after registration" });
      res.json({ user });
    });
  });

  // Login
  router.post("/login", passport.authenticate("local"), (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // Logout
  router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout(function (err) {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  // Get current user
  router.get("/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.json({ user: req.user });
  });

  return router;
}
