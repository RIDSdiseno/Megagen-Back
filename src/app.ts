import express from "express";
import cors from "cors";
import routes from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://megagen.netlify.app"
];
// Necesario para Railway / proxies HTTPS
app.set("trust proxy", 1);

// CORS configurado para aceptar peticiones desde tu frontend en Netlify
app.use(
  cors({
    origin: allowedOrigins,  
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Rutas principales
app.use("/api", routes);

// Middlewares globales
app.use(notFound);
app.use(errorHandler);

export default app;
