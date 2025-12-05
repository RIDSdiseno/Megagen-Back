import { Request, Response } from "express";
import { RolUsuario } from "@prisma/client";
import { prisma } from "../lib/prisma";

const roleMapping: Record<RolUsuario, string[]> = {
  ADMINISTRADOR: ["admin", "superadmin"],
  TRABAJADOR: ["bodeguero"],
  SUPERVISOR: ["supervisor"],
  VENDEDOR: ["vendedor"],
};

const roleLabels: Record<RolUsuario, string> = {
  ADMINISTRADOR: "Administrador",
  TRABAJADOR: "Trabajador",
  SUPERVISOR: "Supervisor",
  VENDEDOR: "Vendedor",
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contrasena son obligatorios" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const token = `fake-token-${Buffer.from(email).toString("base64")}`;

    return res.json({
      token,
      user: {
        email: user.email,
        role: roleLabels[user.rol],
        roles: roleMapping[user.rol] ?? [],
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};
