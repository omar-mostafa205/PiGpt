import { Router } from "express";
import { transcribeController } from "../controllers/transcribeController.js";

export const transcribeRouter = Router();

// POST /api/transcribe — audio in, plain text out
transcribeRouter.post("/", transcribeController);
