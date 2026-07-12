import { Router } from "express";
import { db, usersTable, rolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  signAccessToken,
  signRefreshToken,
  comparePassword,
  verifyRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  validateRefreshToken,
  getUserWithRole,
  revokeAllUserTokens,
} from "../lib/auth";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate";
import { LoginBody, RefreshTokenBody } from "@workspace/api-zod";

const router = Router();

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [userWithRole] = await db
    .select({ user: usersTable, role: rolesTable })
    .from(usersTable)
    .leftJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!userWithRole || !userWithRole.user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const isValid = await comparePassword(password, userWithRole.user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!userWithRole.user.isActive) {
    res.status(401).json({ error: "Account is deactivated" });
    return;
  }

  const roleName = userWithRole.role?.name ?? "dispatcher";

  const payload = {
    userId: userWithRole.user.id,
    email: userWithRole.user.email,
    role: roleName,
    fullName: userWithRole.user.fullName,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await storeRefreshToken(userWithRole.user.id, refreshToken);

  // Update last login
  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, userWithRole.user.id));

  req.log.info({ userId: userWithRole.user.id, role: roleName }, "User logged in");

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: userWithRole.user.id,
      email: userWithRole.user.email,
      fullName: userWithRole.user.fullName,
      role: roleName,
      isActive: userWithRole.user.isActive,
    },
  });
});

// POST /auth/refresh
router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "refreshToken required" });
    return;
  }

  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(parsed.data.refreshToken);
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const isValid = await validateRefreshToken(parsed.data.refreshToken, payload.userId);
  if (!isValid) {
    res.status(401).json({ error: "Refresh token expired or revoked" });
    return;
  }

  // Revoke old and issue new
  await revokeRefreshToken(parsed.data.refreshToken);

  const userWithRole = await getUserWithRole(payload.userId);
  if (!userWithRole) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const roleName = userWithRole.role?.name ?? "dispatcher";
  const newPayload = {
    userId: userWithRole.user.id,
    email: userWithRole.user.email,
    role: roleName,
    fullName: userWithRole.user.fullName,
  };

  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);
  await storeRefreshToken(userWithRole.user.id, newRefreshToken);

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: userWithRole.user.id,
      email: userWithRole.user.email,
      fullName: userWithRole.user.fullName,
      role: roleName,
      isActive: userWithRole.user.isActive,
    },
  });
});

// POST /auth/logout
router.post("/auth/logout", authenticate, async (req: AuthenticatedRequest, res): Promise<void> => {
  if (req.user) {
    await revokeAllUserTokens(req.user.userId);
  }
  res.status(204).send();
});

// GET /auth/me
router.get("/auth/me", authenticate, async (req: AuthenticatedRequest, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userWithRole = await getUserWithRole(req.user.userId);
  if (!userWithRole) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: userWithRole.user.id,
    email: userWithRole.user.email,
    fullName: userWithRole.user.fullName,
    role: userWithRole.role?.name ?? "dispatcher",
    isActive: userWithRole.user.isActive,
  });
});

export default router;
