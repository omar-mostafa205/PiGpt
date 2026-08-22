import { Router } from "express";
import {
  generateQuiz,
  submitQuiz,
  getQuizHistory,
} from "../controllers/quizController.js";

export const quizRouter = Router();

// POST /api/quiz
quizRouter.post("/", generateQuiz);

// POST /api/quiz/submit
quizRouter.post("/submit", submitQuiz);

// GET /api/quiz/history
quizRouter.get("/history", getQuizHistory);
