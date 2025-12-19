"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const authController_1 = require("../controllers/authController");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const quotesController_1 = require("../controllers/quotesController");
const meetingsController_1 = require("../controllers/meetingsController");
const terrainController_1 = require("../controllers/terrainController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadsDir = path_1.default.join(__dirname, "..", "..", "uploads");
fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
    }),
});
router.get("/", (_req, res) => {
    res.json({
        message: "Bienvenido a la API de Megagend",
    });
});
router.get("/health", healthController_1.healthCheck);
router.post("/auth/login", authController_1.login);
router.get("/dashboard/admin", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin"]), dashboardController_1.adminDashboard);
router.get("/dashboard/supervisor", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor"]), dashboardController_1.supervisorDashboard);
router.get("/dashboard/bodega", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "bodeguero"]), dashboardController_1.bodegaDashboard);
router.get("/quotes", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.listQuotes);
router.get("/quotes/summary", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.summaryQuotes);
router.get("/quotes/:id", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.getQuote);
router.post("/quotes", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.createQuote);
router.patch("/quotes/:id/stage", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.updateStage);
router.patch("/quotes/:id/delivery", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.updateDelivery);
router.post("/quotes/scan", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), quotesController_1.scanQuote);
router.post("/quotes/:id/files", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), upload.single("file"), quotesController_1.uploadQuoteFile);
router.get("/meetings", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "vendedor"]), meetingsController_1.listMeetings);
router.post("/meetings", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "vendedor"]), meetingsController_1.createMeeting);
router.patch("/meetings/:id/status", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "vendedor"]), meetingsController_1.updateMeetingStatus);
router.get("/terrain/history", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), terrainController_1.listTerrainHistory);
router.post("/terrain/history", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), terrainController_1.createTerrainHistory);
router.get("/terrain/visits", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), terrainController_1.listTerrainVisits);
router.post("/terrain/visits", auth_1.authRequired, (0, auth_1.requireRoles)(["admin", "superadmin", "supervisor", "bodeguero"]), terrainController_1.createTerrainVisit);
exports.default = router;
