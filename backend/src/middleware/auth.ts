import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

function clearInvalidSession(request: Request): Promise<void> {
  return new Promise((resolve) => request.session.destroy(() => resolve()));
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  if (!request.session.userId) {
    return response.status(401).json({ error: "Authentication required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.session.userId },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) {
      await clearInvalidSession(request);
      response.clearCookie("amaram.sid");
      return response.status(401).json({ error: "Authentication required." });
    }

    request.authUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      return response.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(request.authUser.role)) {
      return response.status(403).json({ error: "Insufficient permissions." });
    }

    return next();
  };
}
