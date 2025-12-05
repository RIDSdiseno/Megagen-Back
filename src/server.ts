import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  // Punto de entrada para iniciar el backend de Megagend
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
