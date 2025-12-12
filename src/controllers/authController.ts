import { Request, Response } from "express";
import { RolUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-env";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contrasena son obligatorios" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const passwordOk =
      (await bcrypt.compare(password, user.password).catch(() => false)) || user.password === password;
    if (!passwordOk) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const roles = roleMapping[user.rol] ?? [];
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        roles,
        rol: user.rol,
      },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );

    return res.json({
      token,
      user: {
        email: user.email,
        role: roleLabels[user.rol],
        roles,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};
