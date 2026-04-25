import { Document } from "mongoose";

export type ActivityType =
  | "created"
  | "updated"
  | "deleted"
  | "commented"
  | "assigned"
  | "status_changed"
  | "uploaded"
  | "exported";

export interface IActivity extends Document {
  tenantId: string;
  actorId: string;
  actorName: string;
  type: ActivityType;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateActivityPayload {
  tenantId: string;
  actorId: string;
  actorName: string;
  type: ActivityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

// cursor is an ISO date string — marks where the last page ended
export interface ActivityFeedQuery {
  cursor?: string;
  limit?: string;
}
