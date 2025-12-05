"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMeetingStatus = exports.createMeeting = exports.listMeetings = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const decodeTokenEmail = (auth) => {
    if (!auth)
        return undefined;
    const token = auth.replace("Bearer ", "");
    if (!token.startsWith("fake-token-"))
        return undefined;
    try {
        const base = token.replace("fake-token-", "");
        const email = Buffer.from(base, "base64").toString("utf-8");
        return email;
    }
    catch {
        return undefined;
    }
};
const listMeetings = async (req, res) => {
    try {
        const email = decodeTokenEmail(req.headers.authorization);
        const user = email ? await prisma_1.prisma.user.findUnique({ where: { email } }) : null;
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const canSeeAll = user?.rol === client_1.RolUsuario.ADMINISTRADOR || user?.rol === client_1.RolUsuario.SUPERVISOR;
        const meetings = await prisma_1.prisma.cita.findMany({
            where: {
                vendedorId: canSeeAll ? undefined : user?.id,
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
            ownerEmail: m.vendedor?.email || email || "",
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
        const email = decodeTokenEmail(req.headers.authorization);
        const user = email ? await prisma_1.prisma.user.findUnique({ where: { email } }) : null;
        const cita = await prisma_1.prisma.cita.create({
            data: {
                titulo: title,
                inicio: new Date(start),
                fin: new Date(end),
                estado: estado && Object.values(client_1.EstadoLead).includes(estado) ? estado : null,
                clienteNombre: clienteNombre || null,
                clienteCorreo: clienteCorreo || null,
                clienteTelefono: clienteTelefono || null,
                vendedorId: user?.id,
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
            ownerEmail: email || "",
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
