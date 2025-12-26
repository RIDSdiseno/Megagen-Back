"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClients = listClients;
exports.updateClient = updateClient;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const mapCliente = (c) => ({
    id: c.id,
    nombre: c.nombre,
    correo: c.correo,
    telefono: c.telefono,
    estado: c.estado,
    origen: c.origen || "",
    vendedorEmail: c.vendedor?.email || "",
    vendedorNombre: c.vendedor?.nombre || "",
    vendedorRol: c.vendedor?.rol || "",
    carpeta: c.carpeta || "",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
});
async function listClients(req, res) {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const estado = typeof req.query.estado === "string" ? req.query.estado : "";
        const vendedorEmail = typeof req.query.vendedorEmail === "string" ? req.query.vendedorEmail.trim() : "";
        const where = {};
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: "insensitive" } },
                { correo: { contains: search, mode: "insensitive" } },
                { telefono: { contains: search, mode: "insensitive" } },
                { origen: { contains: search, mode: "insensitive" } },
            ];
        }
        if (estado && Object.values(client_1.EstadoCliente).includes(estado)) {
            where.estado = estado;
        }
        if (vendedorEmail) {
            where.vendedor = { email: vendedorEmail };
        }
        const clientes = await prisma_1.prisma.cliente.findMany({
            where,
            include: { vendedor: true },
            orderBy: { id: "asc" },
        });
        return res.json(clientes.map(mapCliente));
    }
    catch (err) {
        console.error("listClients error", err);
        return res.status(500).json({ message: "No se pudieron cargar los clientes" });
    }
}
async function updateClient(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "ID invalido" });
    const { estado } = req.body ?? {};
    if (!estado || !Object.values(client_1.EstadoCliente).includes(estado)) {
        return res.status(400).json({ message: "Estado no valido" });
    }
    try {
        const { user } = req;
        const existente = await prisma_1.prisma.cliente.findUnique({ where: { id } });
        if (!existente)
            return res.status(404).json({ message: "Cliente no encontrado" });
        if (user?.rol === client_1.RolUsuario.VENDEDOR && existente.vendedorId && existente.vendedorId !== user.id) {
            return res.status(403).json({ message: "No puedes modificar este cliente" });
        }
        const updated = await prisma_1.prisma.cliente.update({
            where: { id },
            data: { estado: estado },
            include: { vendedor: true },
        });
        return res.json(mapCliente(updated));
    }
    catch (err) {
        console.error("updateClient error", err);
        return res.status(500).json({ message: "No se pudo actualizar el cliente" });
    }
}
