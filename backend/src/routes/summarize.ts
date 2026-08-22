import { Router } from "express";
import { summarizeController } from "../controllers/summarizeController.js";

export const summarizeRouter = Router();

// POST /api/summarize — audio in, structured lecture summary out
summarizeRouter.post("/", summarizeController);
