import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "./roles";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type TokenPayload = {
  sub: string;
  role: Role;
  name: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
