import { Request, Response } from "express";
import { EtapaCotizacion } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type Etapa = "Cotizacion confirmada" | "Despacho" | "Transito" | "Entregado";

export type Quote = {
  id: number;
  codigo: string;
  cliente: string;
  fecha: string;
  total: string;
  etapa: Etapa;
  resumen: string;
  direccion: string;
  comentarios: string;
  imagenUrl?: string;
  archivos: string[];
  historico: { fecha: string; nota: string }[];
  entregaProgramada?: string;
};

const etapasOrden: Etapa[] = ["Cotizacion confirmada", "Despacho", "Transito", "Entregado"];

const labelToEnum: Record<Etapa, EtapaCotizacion> = {
  "Cotizacion confirmada": "COTIZACION_CONFIRMADA",
  Despacho: "DESPACHO",
  Transito: "TRANSITO",
  Entregado: "ENTREGADO",
};

const enumToLabel: Record<EtapaCotizacion, Etapa> = {
  COTIZACION_CONFIRMADA: "Cotizacion confirmada",
  DESPACHO: "Despacho",
  TRANSITO: "Transito",
  ENTREGADO: "Entregado",
};

const formatDateTime = (d: Date) => d.toISOString().replace("T", " ").slice(0, 16);

const mapQuote = (q: any): Quote => ({
  id: q.id,
  codigo: q.codigo,
  cliente: q.cliente,
  fecha: q.fechaCreacion?.toISOString().slice(0, 10) ?? "",
  total: q.total,
  etapa: enumToLabel[q.etapa as EtapaCotizacion] ?? "Cotizacion confirmada",
  resumen: q.resumen ?? "",
  direccion: q.direccion ?? "",
  comentarios: q.comentarios ?? "",
  imagenUrl: q.imagenUrl ?? undefined,
  archivos: (q.archivos ?? []).map((a: any) => a.nombre),
  historico: (q.historial ?? []).map((h: any) => ({
    fecha: h.createdAt ? formatDateTime(h.createdAt) : "",
    nota: h.nota ?? "",
  })),
  entregaProgramada: q.entregaProgramada ? formatDateTime(q.entregaProgramada) : undefined,
});

export const listQuotes = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const quotes = await prisma.cotizacion.findMany({
      where: search
        ? {
            OR: [
              { cliente: { contains: search, mode: "insensitive" } },
              { resumen: { contains: search, mode: "insensitive" } },
              { codigo: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { archivos: true, historial: { orderBy: { createdAt: "asc" } } },
      orderBy: { id: "desc" },
    });
    return res.json(quotes.map(mapQuote));
  } catch (err) {
    console.error("Error listQuotes:", err);
    return res.status(500).json({ message: "No se pudieron cargar las cotizaciones" });
  }
};

export const getQuote = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "ID invalido" });

  try {
    const quote = await prisma.cotizacion.findUnique({
      where: { id },
      include: { archivos: true, historial: { orderBy: { createdAt: "asc" } } },
    });
    if (!quote) return res.status(404).json({ message: "Cotizacion no encontrada" });
    return res.json(mapQuote(quote));
  } catch (err) {
    console.error("Error getQuote:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};

export const summaryQuotes = async (_req: Request, res: Response) => {
  try {
    const quotes = await prisma.cotizacion.findMany({ select: { etapa: true } });
    const summary = etapasOrden.map((etapa) => ({
      etapa,
      total: quotes.filter((q) => enumToLabel[q.etapa] === etapa).length,
    }));
    return res.json(summary);
  } catch (err) {
    console.error("Error summaryQuotes:", err);
    return res.status(500).json({ message: "No se pudo cargar el resumen" });
  }
};

export const createQuote = async (req: Request, res: Response) => {
  const body = req.body ?? {};
  if (!body.cliente || !body.total) {
    return res.status(400).json({ message: "Cliente y total son obligatorios" });
  }

  try {
    const last = await prisma.cotizacion.findFirst({ orderBy: { id: "desc" } });
    const nextId = last ? last.id + 1 : 1;
    const etapaEnum = labelToEnum[body.etapa as Etapa] ?? "COTIZACION_CONFIRMADA";

    const nueva = await prisma.cotizacion.create({
      data: {
        codigo: body.codigo || `COT-${nextId}`,
        cliente: body.cliente,
        total: body.total,
        etapa: etapaEnum,
        resumen: body.resumen || "",
        fechaCreacion: body.fecha ? new Date(body.fecha) : undefined,
        direccion: body.direccion || "",
        comentarios: body.comentarios || "",
        entregaProgramada: body.entregaProgramada ? new Date(body.entregaProgramada) : undefined,
        imagenUrl: body.imagenUrl || null,
        leadId: body.leadId ?? null,
        vendedorId: body.vendedorId ?? null,
        archivos: {
          create: Array.isArray(body.archivos)
            ? body.archivos.map((nombre: string) => ({ nombre, url: nombre }))
            : [],
        },
        historial: {
          create: [{ etapa: etapaEnum, nota: "Cotizacion creada" }],
        },
      },
      include: { archivos: true, historial: true },
    });

    return res.status(201).json(mapQuote(nueva));
  } catch (err) {
    console.error("Error createQuote:", err);
    return res.status(500).json({ message: "No se pudo crear la cotizacion" });
  }
};

export const updateStage = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { etapa: etapaLabel } = req.body ?? {};
  if (Number.isNaN(id)) return res.status(400).json({ message: "ID invalido" });
  if (!etapaLabel || !labelToEnum[etapaLabel as Etapa]) {
    return res.status(400).json({ message: "Etapa no valida" });
  }

  try {
    const quote = await prisma.cotizacion.findUnique({
      where: { id },
      include: { historial: { orderBy: { createdAt: "asc" } }, archivos: true },
    });
    if (!quote) return res.status(404).json({ message: "Cotizacion no encontrada" });

    const actualLabel = enumToLabel[quote.etapa];
    const actualIndex = etapasOrden.indexOf(actualLabel);
    const nuevaIndex = etapasOrden.indexOf(etapaLabel as Etapa);

    if (nuevaIndex < actualIndex) {
      await prisma.cotizacionEstadoLog.create({
        data: {
          cotizacionId: id,
          etapa: quote.etapa,
          nota: "Intento de retroceso bloqueado",
        },
      });
      const refreshed = await prisma.cotizacion.findUnique({
        where: { id },
        include: { historial: { orderBy: { createdAt: "asc" } }, archivos: true },
      });
      return res.status(400).json({
        message: "No es posible retroceder de etapa",
        historico: refreshed ? mapQuote(refreshed).historico : [],
      });
    }

    if (nuevaIndex === actualIndex) {
      return res.json(mapQuote(quote));
    }

    const updated = await prisma.cotizacion.update({
      where: { id },
      data: {
        etapa: labelToEnum[etapaLabel as Etapa],
        historial: {
          create: [{ etapa: labelToEnum[etapaLabel as Etapa], nota: `Etapa cambiada a ${etapaLabel}` }],
        },
      },
      include: { historial: { orderBy: { createdAt: "asc" } }, archivos: true },
    });

    return res.json(mapQuote(updated));
  } catch (err) {
    console.error("Error updateStage:", err);
    return res.status(500).json({ message: "Error al cambiar etapa" });
  }
};

export const updateDelivery = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { entregaProgramada } = req.body ?? {};
  if (Number.isNaN(id)) return res.status(400).json({ message: "ID invalido" });
  if (!entregaProgramada) return res.status(400).json({ message: "entregaProgramada es obligatoria" });

  try {
    const updated = await prisma.cotizacion.update({
      where: { id },
      data: {
        entregaProgramada: new Date(entregaProgramada),
        historial: {
          create: [{ etapa: "TRANSITO" as EtapaCotizacion, nota: `Entrega programada: ${entregaProgramada}` }],
        },
      },
      include: { historial: { orderBy: { createdAt: "asc" } }, archivos: true },
    });
    return res.json(mapQuote(updated));
  } catch (err) {
    console.error("Error updateDelivery:", err);
    return res.status(500).json({ message: "Error al registrar entrega" });
  }
};

// Endpoint demo para "escaneo" (sin OCR real). Devuelve datos sugeridos del documento compartido.
export const scanQuote = (_req: Request, res: Response) => {
  return res.json({
    direccion: "AV Ramon Picarte 427, Oficina 409, Valdivia",
    comentarios: "Enviar a la misma direccion de despacho. La direccion de despacho es Matta 22.",
    resumen: "Pedido implantes Parallel Implant ZM 3.75L 10 mm (100u).",
    total: "$6.500.018",
    cliente: "Patricio Ruiz Araneda / OdontoPlus",
  });
};
