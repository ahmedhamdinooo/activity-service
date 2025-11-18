import { Router } from "express";
import { postActivity, fetchLogs } from "./activity.controller.js";

const router = Router();

router.post("/activity", postActivity);
router.get("/logs", fetchLogs);

export default router;
