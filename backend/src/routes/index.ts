import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { solveRouter } from "./solve.js";
import { progressRouter } from "./progress.js";
import { quizRouter } from "./quiz.js";
import { uploadRouter } from "./upload.js";
import { authRouter } from "./auth.js";
import { summarizeRouter } from "./summarize.js";
import { transcribeRouter } from "./transcribe.js";
import { notesRouter } from "./notes.js";

export const router = Router();

// All routes under /api are protected by Clerk auth
router.use(authMiddleware);

router.use("/auth", authRouter);
router.use("/solve", solveRouter);
router.use("/progress", progressRouter);
router.use("/quiz", quizRouter);
router.use("/upload", uploadRouter);
router.use("/summarize", summarizeRouter);
router.use("/transcribe", transcribeRouter);
router.use("/notes", notesRouter);
