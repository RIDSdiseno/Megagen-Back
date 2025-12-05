import { Router } from "express";
import { healthCheck } from "../controllers/healthController";
import { login } from "../controllers/authController";
import {
  createQuote,
  getQuote,
  listQuotes,
  scanQuote,
  summaryQuotes,
  updateDelivery,
  updateStage,
} from "../controllers/quotesController";
import { listMeetings, createMeeting, updateMeetingStatus } from "../controllers/meetingsController";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    message: "Bienvenido a la API de Megagend",
  });
});

router.get("/health", healthCheck);
router.post("/auth/login", login);
router.get("/quotes", listQuotes);
router.get("/quotes/summary", summaryQuotes);
router.get("/quotes/:id", getQuote);
router.post("/quotes", createQuote);
router.patch("/quotes/:id/stage", updateStage);
router.patch("/quotes/:id/delivery", updateDelivery);
router.post("/quotes/scan", scanQuote);

router.get("/meetings", listMeetings);
router.post("/meetings", createMeeting);
router.patch("/meetings/:id/status", updateMeetingStatus);

export default router;
