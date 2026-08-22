import { Router } from "express";
import { solveController } from "../controllers/solveController.js";
import { solveStreamController } from "../controllers/solveStreamController.js";

export const solveRouter = Router();

// POST /api/solve — one-shot JSON response
solveRouter.post("/", solveController);

// POST /api/solve/stream — NDJSON token stream
solveRouter.post("/stream", solveStreamController);
