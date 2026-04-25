import mongoose, { Schema } from "mongoose";
import { IActivity } from "../interface/activity.interface";

const ActivitySchema = new Schema<IActivity>(
  {
    tenantId:  { type: String, required: true },
    actorId:   { type: String, required: true },
    actorName: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["created", "updated", "deleted", "commented", "assigned", "status_changed", "uploaded", "exported"],
    },
    entityId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// tenantId + createdAt — every feed query hits this, keep it tight
ActivitySchema.index({ tenantId: 1, createdAt: -1 });

const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
