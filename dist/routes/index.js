"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const authController_1 = require("../controllers/authController");
const quotesController_1 = require("../controllers/quotesController");
const meetingsController_1 = require("../controllers/meetingsController");
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    res.json({
        message: "Bienvenido a la API de Megagend",
    });
});
router.get("/health", healthController_1.healthCheck);
router.post("/auth/login", authController_1.login);
router.get("/quotes", quotesController_1.listQuotes);
router.get("/quotes/summary", quotesController_1.summaryQuotes);
router.get("/quotes/:id", quotesController_1.getQuote);
router.post("/quotes", quotesController_1.createQuote);
router.patch("/quotes/:id/stage", quotesController_1.updateStage);
router.patch("/quotes/:id/delivery", quotesController_1.updateDelivery);
router.post("/quotes/scan", quotesController_1.scanQuote);
router.get("/meetings", meetingsController_1.listMeetings);
router.post("/meetings", meetingsController_1.createMeeting);
router.patch("/meetings/:id/status", meetingsController_1.updateMeetingStatus);
exports.default = router;
