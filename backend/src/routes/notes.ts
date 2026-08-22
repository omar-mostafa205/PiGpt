import { Router } from "express";
import { getNotes, deleteNote } from "../controllers/notesController.js";

export const notesRouter = Router();

notesRouter.get("/", getNotes);
notesRouter.delete("/:id", deleteNote);
