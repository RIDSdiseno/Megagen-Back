"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequired = authRequired;
exports.requireRoles = requireRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-env";
async function authRequired(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autenticado" });
    }
    const token = auth.replace("Bearer ", "");
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: Number(payload.sub) } });
        if (!user)
            return res.status(401).json({ message: "Usuario no encontrado" });
        req.user = {
            id: user.id,
            email: user.email,
            roles: payload.roles || [],
            rol: user.rol,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Token invalido" });
    }
}
function requireRoles(roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "No autenticado" });
        if (!roles || roles.length === 0)
            return next();
        const allowed = req.user.roles.some((r) => roles.includes(r) || r === "superadmin");
        if (!allowed)
            return res.status(403).json({ message: "No autorizado" });
        next();
    };
}
