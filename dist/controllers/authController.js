"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const roleMapping = {
    ADMINISTRADOR: ["admin", "superadmin"],
    TRABAJADOR: ["bodeguero"],
    SUPERVISOR: ["supervisor"],
    VENDEDOR: ["vendedor"],
};
const roleLabels = {
    ADMINISTRADOR: "Administrador",
    TRABAJADOR: "Trabajador",
    SUPERVISOR: "Supervisor",
    VENDEDOR: "Vendedor",
};
const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-env";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const login = async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
        return res.status(400).json({ message: "Email y contrasena son obligatorios" });
    }
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Credenciales invalidas" });
        }
        const passwordOk = (await bcryptjs_1.default.compare(password, user.password).catch(() => false)) || user.password === password;
        if (!passwordOk) {
            return res.status(401).json({ message: "Credenciales invalidas" });
        }
        const roles = roleMapping[user.rol] ?? [];
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
            roles,
            rol: user.rol,
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return res.json({
            token,
            user: {
                email: user.email,
                role: roleLabels[user.rol],
                roles,
            },
        });
    }
    catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ message: "Error interno" });
    }
};
exports.login = login;
