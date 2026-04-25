import { Worker, Job } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { ACTIVITY_QUEUE } from "./queue.service";
import { CreateActivityPayload } from "../interface/activity.interface";
import Activity from "../model/activity.model";
import { invalidateFeedCache } from "./cache.service";

let worker: Worker | null = null;

export function startWorker() {
  const concurrency = Number(process.env.WORKER_CONCURRENCY) || 10;

  worker = new Worker(
    ACTIVITY_QUEUE,
    async (job: Job<CreateActivityPayload>) => {
      const { tenantId, actorId, actorName, type, entityId, metadata } = job.data;

      await Activity.create({
        tenantId,
        actorId,
        actorName,
        type,
        entityId,
        metadata: metadata || {},
      });

      // bust the cache so the next read picks up the new activity
      await invalidateFeedCache(tenantId);
    },
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] job done — ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] job failed — ${job?.id} (attempt ${job?.attemptsMade}):`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] error:", err.message);
  });

  console.log(`[Worker] started with concurrency ${concurrency}`);
}

export async function stopWorker() {
  if (!worker) return;
  await worker.close();
  console.log("[Worker] stopped");
}
