import { NextFunction, Request, Response } from "express";
import { TokenPayload, verifyToken } from "../lib/auth";
import { hasPermission, Permission } from "../lib/permissions";
import { Role } from "../lib/roles";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Yetkilendirme gerekli" });
  }
  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    }
    next();
  };
}

/** Sabit rol yerine granular izin kontrolü (bkz. lib/permissions.ts). */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    }
    next();
  };
}
