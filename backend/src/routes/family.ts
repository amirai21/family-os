import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { families } from "../db/schema.js";

export const familyRoutes = new Hono();

// GET /v1/family — list all families
familyRoutes.get("/", async (c) => {
  const rows = await db.select().from(families);
  return c.json(rows);
});

// POST /v1/family — create a new family
familyRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const [row] = await db
    .insert(families)
    .values({ name: body.name ?? "" })
    .returning();
  return c.json(row, 201);
});

// GET /v1/family/by-name/:name — find a family by name (for cross-device login)
familyRoutes.get("/by-name/:name", async (c) => {
  const name = c.req.param("name");
  const [row] = await db
    .select()
    .from(families)
    .where(eq(families.name, name))
    .limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// GET /v1/family/:familyId — get a single family by ID
familyRoutes.get("/:familyId", async (c) => {
  const familyId = c.req.param("familyId");
  const [row] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId));
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// PUT /v1/family/:familyId — update family (e.g. name)
familyRoutes.put("/:familyId", async (c) => {
  const familyId = c.req.param("familyId");
  const body = await c.req.json();
  const [row] = await db
    .update(families)
    .set({ name: body.name, updatedAt: new Date() })
    .where(eq(families.id, familyId))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});
