import { Router } from "express";
import { createActivity, getActivities } from "../controller/activity.controller";
import { validateActivity } from "../middleware/validate";

const router = Router();

router.post("/activities", validateActivity, createActivity);
router.get("/activities/:tenantId", getActivities);

export default router;
