"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTerrainHistory = listTerrainHistory;
exports.createTerrainHistory = createTerrainHistory;
exports.listTerrainVisits = listTerrainVisits;
exports.createTerrainVisit = createTerrainVisit;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const parseDate = (value) => {
    if (!value)
        return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
};
async function listTerrainHistory(req, res) {
    try {
        const { user } = req;
        const bodegueroEmail = typeof req.query.bodegueroEmail === "string" ? req.query.bodegueroEmail : "";
        const tipo = typeof req.query.tipo === "string" ? req.query.tipo : "";
        const from = parseDate(typeof req.query.from === "string" ? req.query.from : undefined);
        const to = parseDate(typeof req.query.to === "string" ? req.query.to : undefined);
        const cliente = typeof req.query.cliente === "string" ? req.query.cliente.trim() : "";
        const where = {};
        if (bodegueroEmail)
            where.bodeguero = { email: bodegueroEmail };
        if (tipo && Object.values(client_1.TerrenoTipo).includes(tipo))
            where.tipo = tipo;
        if (from || to)
            where.fecha = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
        if (cliente)
            where.cotizacion = { cliente: { contains: cliente, mode: "insensitive" } };
        if (user?.rol === client_1.RolUsuario.TRABAJADOR)
            where.bodegueroId = user.id;
        const registros = await prisma_1.prisma.terrenoHistorial.findMany({
            where,
            orderBy: { fecha: "desc" },
            include: { bodeguero: true, cotizacion: true },
        });
        return res.json(registros.map((r) => ({
            id: r.id,
            fecha: r.fecha,
            tipo: r.tipo,
            titulo: r.titulo,
            detalle: r.detalle ?? "",
            ubicacion: r.ubicacion ?? "",
            documento: r.documento ?? "",
            bodegueroEmail: r.bodeguero?.email ?? "",
            bodegueroNombre: r.bodeguero?.nombre ?? "",
            cotizacionId: r.cotizacionId,
            cotizacionCodigo: r.cotizacion?.codigo ?? "",
        })));
    }
    catch (err) {
        console.error("listTerrainHistory error", err);
        return res.status(500).json({ message: "No se pudo cargar historial de terreno" });
    }
}
async function createTerrainHistory(req, res) {
    const { user } = req;
    if (!user)
        return res.status(401).json({ message: "No autenticado" });
    const { fecha, tipo, titulo, detalle, ubicacion, documento, bodegueroEmail, cotizacionId } = req.body ?? {};
    if (!fecha || !titulo)
        return res.status(400).json({ message: "fecha y titulo son obligatorios" });
    const allowedRoles = [client_1.RolUsuario.ADMINISTRADOR, client_1.RolUsuario.SUPERVISOR, client_1.RolUsuario.TRABAJADOR];
    if (!allowedRoles.includes(user.rol)) {
        return res.status(403).json({ message: "No autorizado" });
    }
    try {
        let bodegueroId = null;
        if (bodegueroEmail) {
            const bode = await prisma_1.prisma.user.findUnique({ where: { email: bodegueroEmail } });
            bodegueroId = bode?.id ?? null;
        }
        const created = await prisma_1.prisma.terrenoHistorial.create({
            data: {
                fecha: new Date(fecha),
                tipo: Object.values(client_1.TerrenoTipo).includes(tipo) ? tipo : client_1.TerrenoTipo.SALIDA,
                titulo,
                detalle: detalle || "",
                ubicacion: ubicacion || "",
                documento: documento || "",
                bodegueroId: bodegueroId ?? user.id,
                cotizacionId: cotizacionId ? Number(cotizacionId) : null,
            },
            include: { bodeguero: true, cotizacion: true },
        });
        return res.status(201).json({
            id: created.id,
            fecha: created.fecha,
            tipo: created.tipo,
            titulo: created.titulo,
            detalle: created.detalle || "",
            ubicacion: created.ubicacion || "",
            documento: created.documento || "",
            bodegueroEmail: created.bodeguero?.email ?? "",
            bodegueroNombre: created.bodeguero?.nombre ?? "",
            cotizacionId: created.cotizacionId,
            cotizacionCodigo: created.cotizacion?.codigo ?? "",
        });
    }
    catch (err) {
        console.error("createTerrainHistory error", err);
        return res.status(500).json({ message: "No se pudo crear el registro de terreno" });
    }
}
async function listTerrainVisits(req, res) {
    try {
        const { user } = req;
        const bodegueroEmail = typeof req.query.bodegueroEmail === "string" ? req.query.bodegueroEmail : "";
        const estado = typeof req.query.estado === "string" ? req.query.estado : "";
        const from = parseDate(typeof req.query.from === "string" ? req.query.from : undefined);
        const to = parseDate(typeof req.query.to === "string" ? req.query.to : undefined);
        const cliente = typeof req.query.cliente === "string" ? req.query.cliente.trim() : "";
        const where = {};
        if (bodegueroEmail)
            where.bodeguero = { email: bodegueroEmail };
        if (estado && Object.values(client_1.VisitaEstado).includes(estado))
            where.estado = estado;
        if (from || to)
            where.fecha = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
        if (cliente)
            where.cliente = { contains: cliente, mode: "insensitive" };
        if (user?.rol === client_1.RolUsuario.TRABAJADOR)
            where.bodegueroId = user.id;
        const visitas = await prisma_1.prisma.visitaTerreno.findMany({
            where,
            orderBy: { fecha: "desc" },
            include: { bodeguero: true, cotizacion: true },
        });
        return res.json(visitas.map((v) => ({
            id: v.id,
            fecha: v.fecha,
            estado: v.estado,
            cliente: v.cliente || v.cotizacion?.cliente || "",
            direccion: v.direccion ?? v.cotizacion?.direccion ?? "",
            motivo: v.motivo ?? "",
            resultado: v.resultado ?? "",
            comentarios: v.comentarios ?? "",
            bodegueroEmail: v.bodeguero?.email ?? "",
            bodegueroNombre: v.bodeguero?.nombre ?? "",
            cotizacionId: v.cotizacionId,
            cotizacionCodigo: v.cotizacion?.codigo ?? "",
        })));
    }
    catch (err) {
        console.error("listTerrainVisits error", err);
        return res.status(500).json({ message: "No se pudo cargar visitas a terreno" });
    }
}
async function createTerrainVisit(req, res) {
    const { user } = req;
    if (!user)
        return res.status(401).json({ message: "No autenticado" });
    const { fecha, estado, cliente, direccion, motivo, resultado, comentarios, bodegueroEmail, cotizacionId } = req.body ?? {};
    if (!fecha)
        return res.status(400).json({ message: "fecha es obligatoria" });
    const allowedRoles = [client_1.RolUsuario.ADMINISTRADOR, client_1.RolUsuario.SUPERVISOR, client_1.RolUsuario.TRABAJADOR];
    if (!allowedRoles.includes(user.rol)) {
        return res.status(403).json({ message: "No autorizado" });
    }
    try {
        let bodegueroId = null;
        let bodegueroEmailFinal = bodegueroEmail || user.email;
        if (bodegueroEmailFinal) {
            const bode = await prisma_1.prisma.user.findUnique({ where: { email: bodegueroEmailFinal } });
            bodegueroId = bode?.id ?? null;
            bodegueroEmailFinal = bode?.email || bodegueroEmailFinal;
        }
        let cotizacionData = null;
        const cotIdNum = cotizacionId ? Number(cotizacionId) : null;
        if (cotIdNum) {
            cotizacionData = await prisma_1.prisma.cotizacion.findUnique({
                where: { id: cotIdNum },
                select: { id: true, codigo: true, cliente: true, direccion: true },
            });
        }
        if (!cliente && !cotizacionData?.cliente) {
            return res.status(400).json({ message: "cliente o cotizacionId es obligatorio" });
        }
        const estadoValido = Object.values(client_1.VisitaEstado).includes(estado)
            ? estado
            : client_1.VisitaEstado.PROGRAMADA;
        const created = await prisma_1.prisma.visitaTerreno.create({
            data: {
                fecha: new Date(fecha),
                estado: estadoValido,
                cliente: cliente || cotizacionData?.cliente || "",
                direccion: direccion || cotizacionData?.direccion || "",
                motivo: motivo || "",
                resultado: resultado || "",
                comentarios: comentarios || "",
                bodegueroId: bodegueroId ?? user.id,
                cotizacionId: cotizacionData?.id ?? (cotIdNum ? cotIdNum : null),
            },
            include: { bodeguero: true, cotizacion: true },
        });
        return res.status(201).json({
            id: created.id,
            fecha: created.fecha,
            estado: created.estado,
            cliente: created.cliente || created.cotizacion?.cliente || "",
            direccion: created.direccion || created.cotizacion?.direccion || "",
            motivo: created.motivo || "",
            resultado: created.resultado || "",
            comentarios: created.comentarios || "",
            bodegueroEmail: created.bodeguero?.email ?? bodegueroEmailFinal ?? "",
            bodegueroNombre: created.bodeguero?.nombre ?? "",
            cotizacionId: created.cotizacionId,
            cotizacionCodigo: created.cotizacion?.codigo ?? cotizacionData?.codigo ?? "",
        });
    }
    catch (err) {
        console.error("createTerrainVisit error", err);
        return res.status(500).json({ message: "No se pudo crear la visita a terreno" });
    }
}
