import { Request, Response } from "express";
import Activity from "../model/activity.model";
import { enqueueActivity } from "../services/queue.service";
import { getCachedFeed, setCachedFeed } from "../services/cache.service";
import { CreateActivityPayload } from "../interface/activity.interface";

export async function createActivity(req: Request, res: Response): Promise<void> {
  const payload = req.body as CreateActivityPayload;

  await enqueueActivity(payload);

  // we just queue it here, the worker handles the actual DB write
  res.status(202).json({ success: true, message: "Activity queued" });
}

export async function getActivities(req: Request, res: Response): Promise<void> {
  const tenantId = String(req.params.tenantId);
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const type = req.query.type as string | undefined;

  // check cache first
  const cached = await getCachedFeed<object>(tenantId, cursor || "", limit, type || "all");
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  const query: Record<string, unknown> = { tenantId };

  if (type) query.type = type;

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (isNaN(cursorDate.getTime())) {
      res.status(400).json({ success: false, message: "Invalid cursor, expected an ISO date string" });
      return;
    }
    query.createdAt = { $lt: cursorDate };
  }

  const activities = await Activity.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .select("actorId actorName type entityId metadata createdAt")
    .lean();

  const hasMore = activities.length > limit;
  const data = hasMore ? activities.slice(0, limit) : activities;
  const nextCursor = hasMore ? data[data.length - 1].createdAt : null;

  const response = { success: true, data, nextCursor, hasMore };

  await setCachedFeed(tenantId, cursor || "", limit, response, type || "all");

  res.status(200).json(response);
}
