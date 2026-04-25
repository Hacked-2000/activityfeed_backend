import { Request, Response, NextFunction } from "express";
import { CreateActivityPayload } from "../interface/activity.interface";

const VALID_TYPES = [
  "created",
  "updated",
  "deleted",
  "commented",
  "assigned",
  "status_changed",
  "uploaded",
  "exported",
];

export function validateActivity(req: Request, res: Response, next: NextFunction): void {
  const { tenantId, actorId, actorName, type, entityId } = req.body as CreateActivityPayload;

  if (!tenantId || !actorId || !actorName || !type || !entityId) {
    res.status(400).json({
      success: false,
      message: "tenantId, actorId, actorName, type, and entityId are all required",
    });
    return;
  }

  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({
      success: false,
      message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`,
    });
    return;
  }

  next();
}
