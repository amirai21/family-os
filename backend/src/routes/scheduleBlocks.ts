import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { scheduleBlocksRepo } from "../repos/scheduleBlocksRepo.js";
import {
  createScheduleBlockSchema,
  upsertScheduleBlockSchema,
  patchScheduleBlockSchema,
} from "../schemas/scheduleBlocks.js";

export const scheduleBlocksRoutes = new Hono();

// Shared validation-error responder
const onValidationError = (
  result: { success: boolean; error?: { issues: unknown } },
  c: { json: (body: unknown, status: number) => Response },
) => {
  if (!result.success) {
    return c.json(
      { error: "Validation failed", issues: result.error?.issues },
      400,
    );
  }
};

// GET  /v1/family/:familyId/schedule-blocks
scheduleBlocksRoutes.get("/", async (c) => {
  const familyId = c.req.param("familyId")!;
  const rows = await scheduleBlocksRepo.listByFamily(familyId);
  return c.json(rows);
});

// POST /v1/family/:familyId/schedule-blocks
scheduleBlocksRoutes.post(
  "/",
  zValidator("json", createScheduleBlockSchema, onValidationError as never),
  async (c) => {
    const familyId = c.req.param("familyId")!;
    const body = c.req.valid("json");
    const row = await scheduleBlocksRepo.create({ ...body, familyId });
    return c.json(row, 201);
  },
);

// PUT  /v1/family/:familyId/schedule-blocks/:id  (upsert)
scheduleBlocksRoutes.put(
  "/:id",
  zValidator("json", upsertScheduleBlockSchema, onValidationError as never),
  async (c) => {
    const familyId = c.req.param("familyId")!;
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const row = await scheduleBlocksRepo.upsert({ ...body, id, familyId });
    return c.json(row);
  },
);

// PATCH /v1/family/:familyId/schedule-blocks/:id  (partial update)
scheduleBlocksRoutes.patch(
  "/:id",
  zValidator("json", patchScheduleBlockSchema, onValidationError as never),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const row = await scheduleBlocksRepo.update(id, body);
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  },
);

// DELETE /v1/family/:familyId/schedule-blocks/:id
scheduleBlocksRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const ok = await scheduleBlocksRepo.delete(id);
  if (!ok) return c.json({ error: "Not found" }, 404);
  return c.json({ deleted: true });
});
