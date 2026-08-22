import { Router } from "express";

export const authRouter = Router();

authRouter.get("/me", (req, res) => {
  res.json({ userId: req.clerkAuth?.userId ?? null });
});

