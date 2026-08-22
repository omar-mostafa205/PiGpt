import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../utils/logger.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Store file in memory — no disk writes needed
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are supported"));
    }
  },
});

export const uploadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const { text } = await pdfParse(req.file.buffer);

    const extractedText = (text as string)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    if (!extractedText) {
      return res.status(422).json({ error: "Could not extract text from PDF" });
    }

    logger.info(
      `PDF uploaded | size=${req.file.size} chars=${extractedText.length}`
    );

    return res.json({ extractedText });
  } catch (err) {
    next(err);
  }
};
