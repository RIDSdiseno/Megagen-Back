import { Request, Response } from "express";
import { EstadoCliente, RolUsuario } from "@prisma/client";
import { prisma } from "../lib/prisma";

type AuthRequest = Request & {
  user?: { id: number; email: string; roles: string[]; rol: RolUsuario };
};

const mapCliente = (c: any) => ({
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

export async function listClients(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const estado = typeof req.query.estado === "string" ? req.query.estado : "";
    const vendedorEmail = typeof req.query.vendedorEmail === "string" ? req.query.vendedorEmail.trim() : "";

    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { correo: { contains: search, mode: "insensitive" } },
        { telefono: { contains: search, mode: "insensitive" } },
        { origen: { contains: search, mode: "insensitive" } },
      ];
    }
    if (estado && Object.values(EstadoCliente).includes(estado as EstadoCliente)) {
      where.estado = estado as EstadoCliente;
    }
    if (vendedorEmail) {
      where.vendedor = { email: vendedorEmail };
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: { vendedor: true },
      orderBy: { id: "asc" },
    });

    return res.json(clientes.map(mapCliente));
  } catch (err) {
    console.error("listClients error", err);
    return res.status(500).json({ message: "No se pudieron cargar los clientes" });
  }
}

export async function updateClient(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "ID invalido" });

  const { estado } = req.body ?? {};
  if (!estado || !Object.values(EstadoCliente).includes(estado as EstadoCliente)) {
    return res.status(400).json({ message: "Estado no valido" });
  }

  try {
    const { user } = req as AuthRequest;
    const existente = await prisma.cliente.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ message: "Cliente no encontrado" });

    if (user?.rol === RolUsuario.VENDEDOR && existente.vendedorId && existente.vendedorId !== user.id) {
      return res.status(403).json({ message: "No puedes modificar este cliente" });
    }

    const updated = await prisma.cliente.update({
      where: { id },
      data: { estado: estado as EstadoCliente },
      include: { vendedor: true },
    });

    return res.json(mapCliente(updated));
  } catch (err) {
    console.error("updateClient error", err);
    return res.status(500).json({ message: "No se pudo actualizar el cliente" });
  }
}
