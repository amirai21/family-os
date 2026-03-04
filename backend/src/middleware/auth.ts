/**
 * middleware/auth.ts — JWT authentication + family authorization.
 *
 * jwtAuth:     Validates Bearer token, attaches decoded user to context.
 * familyGuard: Ensures the JWT user belongs to the :familyId in the URL.
 */

import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JwtPayload = {
  sub: string; // user ID
  familyId: string;
  username: string;
  iat: number;
  exp: number;
};

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Validate the Authorization: Bearer <jwt> header.
 * Attaches the decoded payload to `c.get("user")`.
 */
export const jwtAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[auth] JWT_SECRET is not set");
    return c.json({ error: "Server configuration error" }, 500);
  }

  try {
    const payload = (await verify(token, secret, "HS256")) as unknown as JwtPayload;
    c.set("user", payload);
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  await next();
});

/**
 * Ensure the JWT user has access to the :familyId in the URL.
 * Must be applied AFTER jwtAuth.
 */
export const familyGuard = createMiddleware(async (c, next) => {
  const user = c.get("user");
  const familyId = c.req.param("familyId");

  if (familyId && user.familyId !== familyId) {
    return c.json(
      { error: "Forbidden: you do not belong to this family" },
      403,
    );
  }

  await next();
});
