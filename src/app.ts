import express from "express";
import cors from "cors";
import routes from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";
import fs from "fs";

const app = express();

// Lista de dominios permitidos
const allowedOrigins = [
  "http://localhost:5173",
  "https://megagen.netlify.app"
];

// Necesario para que Railway no envíe redirect en OPTIONS
app.set("trust proxy", 1);

// CORS configurado correctamente
app.use(
  cors({
    origin: function (origin, callback) {
      // Permite llamadas sin origin (Postman, backend-to-backend)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origen no permitido por CORS: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204, // <- evita redirecciones en preflight
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
