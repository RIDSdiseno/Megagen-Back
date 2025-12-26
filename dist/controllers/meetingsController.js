"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMeeting = exports.updateMeetingStatus = exports.createMeeting = exports.listMeetings = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const listMeetings = async (req, res) => {
    try {
        const { user } = req;
        if (!user)
            return res.status(401).json({ message: "No autenticado" });
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const vendedorEmail = typeof req.query.vendedorEmail === "string" ? req.query.vendedorEmail.trim() : "";
        const canSeeAll = user.rol === client_1.RolUsuario.ADMINISTRADOR || user.rol === client_1.RolUsuario.SUPERVISOR;
        const meetings = await prisma_1.prisma.cita.findMany({
            where: {
                vendedorId: canSeeAll
                    ? undefined
                    : user?.id,
                vendedor: canSeeAll && vendedorEmail ? { email: vendedorEmail } : undefined,
                OR: search
                    ? [
                        { titulo: { contains: search, mode: "insensitive" } },
                        { clienteNombre: { contains: search, mode: "insensitive" } },
                        { clienteCorreo: { contains: search, mode: "insensitive" } },
                        { clienteTelefono: { contains: search, mode: "insensitive" } },
                    ]
                    : undefined,
            },
            orderBy: { inicio: "asc" },
            include: { vendedor: true },
        });
        return res.json(meetings.map((m) => ({
            id: m.id,
            title: m.titulo,
            start: m.inicio,
            end: m.fin,
            estado: m.estado,
            paciente: m.clienteNombre || "",
            telefono: m.clienteTelefono || "",
            correo: m.clienteCorreo || "",
            ownerEmail: m.vendedor?.email || user.email,
        })));
    }
    catch (err) {
        console.error("listMeetings error", err);
        return res.status(500).json({ message: "No se pudieron listar reuniones" });
    }
};
exports.listMeetings = listMeetings;
const createMeeting = async (req, res) => {
    const { title, start, end, clienteNombre, clienteCorreo, clienteTelefono, estado } = req.body ?? {};
    if (!title || !start || !end) {
        return res.status(400).json({ message: "title, start y end son obligatorios" });
    }
    try {
        const { user } = req;
        if (!user)
            return res.status(401).json({ message: "No autenticado" });
        const cita = await prisma_1.prisma.cita.create({
            data: {
                titulo: title,
                inicio: new Date(start),
                fin: new Date(end),
                estado: estado && Object.values(client_1.EstadoLead).includes(estado) ? estado : null,
                clienteNombre: clienteNombre || null,
                clienteCorreo: clienteCorreo || null,
                clienteTelefono: clienteTelefono || null,
                vendedorId: user.id,
            },
        });
        return res.status(201).json({
            id: cita.id,
            title: cita.titulo,
            start: cita.inicio,
            end: cita.fin,
            estado: cita.estado,
            paciente: cita.clienteNombre || "",
            telefono: cita.clienteTelefono || "",
            correo: cita.clienteCorreo || "",
            ownerEmail: user.email,
        });
    }
    catch (err) {
        console.error("createMeeting error", err);
        return res.status(500).json({ message: "No se pudo crear la reunion" });
    }
};
exports.createMeeting = createMeeting;
const updateMeetingStatus = async (req, res) => {
    const id = Number(req.params.id);
    const { estado } = req.body ?? {};
    if (Number.isNaN(id) || !estado)
        return res.status(400).json({ message: "Datos invalidos" });
    try {
        const updated = await prisma_1.prisma.cita.update({
            where: { id },
            data: { estado: estado },
            include: { vendedor: true },
        });
        return res.json({
            id: updated.id,
            title: updated.titulo,
            start: updated.inicio,
            end: updated.fin,
            estado: updated.estado,
            paciente: updated.clienteNombre || "",
            telefono: updated.clienteTelefono || "",
            correo: updated.clienteCorreo || "",
            ownerEmail: updated.vendedor?.email || "",
        });
    }
    catch (err) {
        console.error("updateMeetingStatus error", err);
        return res.status(500).json({ message: "No se pudo actualizar la reunion" });
    }
};
exports.updateMeetingStatus = updateMeetingStatus;
const updateMeeting = async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "ID invalido" });
    try {
        const { user } = req;
        if (!user)
            return res.status(401).json({ message: "No autenticado" });
        const canSeeAll = user.rol === client_1.RolUsuario.ADMINISTRADOR || user.rol === client_1.RolUsuario.SUPERVISOR;
        const existente = await prisma_1.prisma.cita.findUnique({ where: { id }, include: { vendedor: true } });
        if (!existente)
            return res.status(404).json({ message: "Reunion no encontrada" });
        if (!canSeeAll && existente.vendedorId !== user.id) {
            return res.status(403).json({ message: "No puedes modificar esta reunion" });
        }
        const { title, start, end, estado, clienteNombre, clienteCorreo, clienteTelefono } = req.body ?? {};
        const data = {};
        if (title !== undefined)
            data.titulo = title;
        if (start)
            data.inicio = new Date(start);
        if (end)
            data.fin = new Date(end);
        if (estado && Object.values(client_1.EstadoLead).includes(estado))
            data.estado = estado;
        if (clienteNombre !== undefined)
            data.clienteNombre = clienteNombre || null;
        if (clienteCorreo !== undefined)
            data.clienteCorreo = clienteCorreo || null;
        if (clienteTelefono !== undefined)
            data.clienteTelefono = clienteTelefono || null;
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "Sin cambios" });
        }
        const updated = await prisma_1.prisma.cita.update({
            where: { id },
            data,
            include: { vendedor: true },
        });
        return res.json({
            id: updated.id,
            title: updated.titulo,
            start: updated.inicio,
            end: updated.fin,
            estado: updated.estado,
            paciente: updated.clienteNombre || "",
            telefono: updated.clienteTelefono || "",
            correo: updated.clienteCorreo || "",
            ownerEmail: updated.vendedor?.email || user.email,
        });
    }
    catch (err) {
        console.error("updateMeeting error", err);
        return res.status(500).json({ message: "No se pudo actualizar la reunion" });
    }
};
exports.updateMeeting = updateMeeting;
