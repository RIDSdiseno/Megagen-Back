import { Router } from "express";
import { healthCheck } from "../controllers/healthController";
import { login } from "../controllers/authController";
import { adminDashboard, bodegaDashboard, supervisorDashboard } from "../controllers/dashboardController";
import { authRequired, requireRoles } from "../middleware/auth";
import {
  createQuote,
  getQuote,
  listQuotes,
  scanQuote,
  summaryQuotes,
  updateDelivery,
  updateStage,
  uploadQuoteFile,
} from "../controllers/quotesController";
import { listMeetings, createMeeting, updateMeetingStatus } from "../controllers/meetingsController";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) =>
      cb(null, uploadsDir),
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
  }),
});

router.get("/", (_req, res) => {
  res.json({
    message: "Bienvenido a la API de Megagend",
  });
});

router.get("/health", healthCheck);
router.post("/auth/login", login);

router.get(
  "/dashboard/admin",
  authRequired,
  requireRoles(["admin", "superadmin"]),
  adminDashboard
);
router.get(
  "/dashboard/supervisor",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor"]),
  supervisorDashboard
);
router.get(
  "/dashboard/bodega",
  authRequired,
  requireRoles(["admin", "superadmin", "bodeguero"]),
  bodegaDashboard
);

router.get(
  "/quotes",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  listQuotes
);
router.get(
  "/quotes/summary",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  summaryQuotes
);
router.get(
  "/quotes/:id",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  getQuote
);
router.post(
  "/quotes",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  createQuote
);
router.patch(
  "/quotes/:id/stage",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  updateStage
);
router.patch(
  "/quotes/:id/delivery",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  updateDelivery
);
router.post(
  "/quotes/scan",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  scanQuote
);
router.post(
  "/quotes/:id/files",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "bodeguero"]),
  upload.single("file"),
  uploadQuoteFile
);

router.get(
  "/meetings",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "vendedor"]),
  listMeetings
);
router.post(
  "/meetings",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "vendedor"]),
  createMeeting
);
router.patch(
  "/meetings/:id/status",
  authRequired,
  requireRoles(["admin", "superadmin", "supervisor", "vendedor"]),
  updateMeetingStatus
);

export default router;
