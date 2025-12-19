import express from "express";
import cors from "cors";
import routes from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";
import fs from "fs";

const app = express();

// Lista de dominios permitidos
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://localhost:5174",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://megagen.netlify.app",
];

const envAllowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowAll = process.env.CORS_ALLOW_ALL === "true";

const allowedOrigins = [...defaultAllowedOrigins, ...envAllowed];

// Necesario para que Railway no envíe redirect en OPTIONS
app.set("trust proxy", 1);

// CORS configurado correctamente
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, Railway health, etc.)
      if (!origin || allowAll) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, origin); // <- IMPORTANTE
      }

      // ❌ NO lanzar error
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);


// Respuesta manual a OPTIONS (preflight) para evitar redirect de Railway
app.options("*", (req, res) => {
  res.sendStatus(204);
});

// Archivos estaticos para uploads de cotizaciones
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.use(express.json());

// Rutas principales
app.use("/api", routes);

// Middlewares globales
app.use(notFound);
app.use(errorHandler);

export default app;
