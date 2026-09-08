import argon2 from "argon2";
import { Router } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

const router = Router();
router.use((_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  return next();
});

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(1).max(1024),
  })
  .strict();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

function publicUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });
}

function destroySession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

function clearSessionCookie(response: Response) {
  response.clearCookie("amaram.sid", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });
}

router.post("/login", loginRateLimiter, async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid request data." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const passwordMatches = user?.active
      ? await argon2.verify(user.passwordHash, parsed.data.password)
      : false;

    if (!user || !user.active || !passwordMatches) {
      return response.status(401).json({ error: "Invalid email or password." });
    }

    await regenerateSession(request);
    request.session.userId = user.id;
    await saveSession(request);

    return response.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", async (request, response, next) => {
  if (!request.session.userId) {
    return response.status(401).json({ error: "Authentication required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: request.session.userId } });

    if (!user) {
      await destroySession(request);
      clearSessionCookie(response);
      return response.status(401).json({ error: "Authentication required." });
    }

    if (!user.active) {
      await destroySession(request);
      clearSessionCookie(response);
      return response.status(403).json({ error: "Account unavailable." });
    }

    return response.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (request, response, next) => {
  try {
    if (request.session.userId) {
      await destroySession(request);
    }

    clearSessionCookie(response);
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export { router as authRouter };
