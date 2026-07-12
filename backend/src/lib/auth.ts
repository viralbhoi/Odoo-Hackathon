import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, rolesTable, refreshTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

// ── Secrets — must be set via environment variables in production ─────────────
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production.");
    process.exit(1);
  } else {
    console.warn(
      "[WARN] JWT secrets not set via env vars. Using insecure defaults — set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET before deploying."
    );
  }
}

const ACCESS_SECRET_FINAL = ACCESS_SECRET ?? "transitops-dev-access-secret-do-not-use-in-prod";
const REFRESH_SECRET_FINAL = REFRESH_SECRET ?? "transitops-dev-refresh-secret-do-not-use-in-prod";

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  fullName: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET_FINAL, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET_FINAL, { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET_FINAL) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET_FINAL) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getUserWithRole(userId: number) {
  const [result] = await db
    .select({ user: usersTable, role: rolesTable })
    .from(usersTable)
    .leftJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(eq(usersTable.id, userId));
  return result;
}

export async function storeRefreshToken(userId: number, refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);
  await db.insert(refreshTokensTable).values({ userId, tokenHash, expiresAt });
}

export async function revokeRefreshToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokensTable.tokenHash, tokenHash));
}

export async function validateRefreshToken(refreshToken: string, userId: number): Promise<boolean> {
  const tokenHash = hashToken(refreshToken);
  const now = new Date();
  const [token] = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.tokenHash, tokenHash),
        eq(refreshTokensTable.userId, userId),
        gt(refreshTokensTable.expiresAt, now)
      )
    );
  if (!token || token.revokedAt) return false;
  return true;
}

export async function revokeAllUserTokens(userId: number) {
  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokensTable.userId, userId));
}
