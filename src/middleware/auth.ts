import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { RolUsuario } from "@prisma/client";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-env";

type JwtPayload = {
  sub: number;
  email: string;
  roles: string[];
  rol: RolUsuario;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        roles: string[];
        rol: RolUsuario;
      };
    }
  }
}

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const token = auth.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, JWT_SECRET as jwt.Secret) as unknown as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

    req.user = {
      id: user.id,
      email: user.email,
      roles: payload.roles || [],
      rol: user.rol,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalido" });
  }
}

export function requireRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "No autenticado" });
    if (!roles || roles.length === 0) return next();

    const allowed = req.user.roles.some((r) => roles.includes(r) || r === "superadmin");
    if (!allowed) return res.status(403).json({ message: "No autorizado" });
    next();
  };
}
