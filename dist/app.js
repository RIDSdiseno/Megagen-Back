"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = require("./middleware/notFound");
const errorHandler_1 = require("./middleware/errorHandler");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
// Lista de dominios permitidos
const allowedOrigins = [
    "http://localhost:5173",
    "https://megagen.netlify.app"
];
// Necesario para que Railway no envíe redirect en OPTIONS
app.set("trust proxy", 1);
// CORS configurado correctamente
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Permite llamadas sin origin (Postman, backend-to-backend)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Origen no permitido por CORS: " + origin));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204, // <- evita redirecciones en preflight
}));
// Respuesta manual a OPTIONS (preflight) para evitar redirect de Railway
app.options("*", (req, res) => {
    res.sendStatus(204);
});
// Archivos estaticos para uploads de cotizaciones
const uploadsDir = path_1.default.join(__dirname, "..", "uploads");
fs_1.default.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express_1.default.static(uploadsDir));
app.use(express_1.default.json());
// Rutas principales
app.use("/api", routes_1.default);
// Middlewares globales
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
