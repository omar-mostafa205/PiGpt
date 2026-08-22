import { Router } from "express";
import {
  getProgress,
  getRecentProblems,
  getProblem,
  getWeakTopics,
  getStreakCalendar,
} from "../controllers/progressController.js";

export const progressRouter = Router();

// GET /api/progress
progressRouter.get("/", getProgress);

// GET /api/progress/recent
progressRouter.get("/recent", getRecentProblems);

// GET /api/progress/problem/:id — one saved problem, answer included
progressRouter.get("/problem/:id", getProblem);

// GET /api/progress/weak-topics
progressRouter.get("/weak-topics", getWeakTopics);

// GET /api/progress/streak
progressRouter.get("/streak", getStreakCalendar);
