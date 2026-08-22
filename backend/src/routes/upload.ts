import { Router } from "express";
import { upload, uploadController } from "../controllers/uploadController.js";

export const uploadRouter = Router();

// POST /api/upload — multer processes multipart/form-data, field name "file"
uploadRouter.post("/", upload.single("file"), uploadController);
