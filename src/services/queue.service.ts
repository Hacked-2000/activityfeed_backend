import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { CreateActivityPayload } from "../interface/activity.interface";

export const ACTIVITY_QUEUE = "activity-feed";

const activityQueue = new Queue(ACTIVITY_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

activityQueue.on("error", (err) => {
  console.error("[Queue] error:", err.message);
});

export async function enqueueActivity(payload: CreateActivityPayload) {
  // deduplicate: same actor doing the same thing on the same entity within the same second gets one job
  const jobId = `${payload.tenantId}_${payload.actorId}_${payload.entityId}_${payload.type}_${Math.floor(Date.now() / 1000)}`;

  await activityQueue.add(payload.type, payload, { jobId });
}

export default activityQueue;
