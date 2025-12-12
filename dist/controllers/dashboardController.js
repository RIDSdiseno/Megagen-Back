"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboard = adminDashboard;
exports.supervisorDashboard = supervisorDashboard;
exports.bodegaDashboard = bodegaDashboard;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const leadLabel = {
    NUEVO: "Nuevo",
    COTIZANDO: "Cotizando",
    EN_PROCESO: "En Proceso",
    CONFIRMADO: "Confirmado",
    ENTREGADO: "Entregado",
};
const clienteLabel = {
    ACTIVO: "Activo",
    ONBOARDING: "Onboarding",
    EN_RIESGO: "En riesgo",
};
const etapaLabel = {
    COTIZACION_CONFIRMADA: "Cotizacion confirmada",
    DESPACHO: "Despacho",
    TRANSITO: "Transito",
    ENTREGADO: "Entregado",
};
const vendorRoles = [client_1.RolUsuario.VENDEDOR, client_1.RolUsuario.SUPERVISOR, client_1.RolUsuario.ADMINISTRADOR];
const normalizeGroup = (entries) => entries.map((e) => ({ key: e.value, total: e.total }));
async function adminDashboard(req, res) {
    try {
        const [leadEstados, clientesEstados, cotEtapas] = await Promise.all([
            prisma_1.prisma.lead.groupBy({ by: ["estado"], _count: true }),
            prisma_1.prisma.cliente.groupBy({ by: ["estado"], _count: true }),
            prisma_1.prisma.cotizacion.groupBy({ by: ["etapa"], _count: true }),
        ]);
        const vendors = await prisma_1.prisma.user.findMany({
            where: { rol: { in: vendorRoles } },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
            },
            orderBy: { id: "asc" },
        });
        const leadsPorVendedor = await prisma_1.prisma.lead.groupBy({
            by: ["ownerId", "estado"],
            _count: true,
        });
        const clientesPorVendedor = await prisma_1.prisma.cliente.groupBy({
            by: ["vendedorId", "estado"],
            _count: true,
        });
        const cotPorVendedor = await prisma_1.prisma.cotizacion.groupBy({
            by: ["vendedorId", "etapa"],
            _count: true,
        });
        const ultimosLeads = await prisma_1.prisma.lead.findMany({
            select: {
                id: true,
                nombre: true,
                estado: true,
                resumen: true,
                ownerId: true,
                telefono: true,
                correo: true,
                proximoPaso: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 40,
        });
        const ultimasCotizaciones = await prisma_1.prisma.cotizacion.findMany({
            select: {
                id: true,
                codigo: true,
                cliente: true,
                etapa: true,
                vendedorId: true,
                entregaProgramada: true,
                resumen: true,
                total: true,
            },
            orderBy: { id: "desc" },
            take: 25,
        });
        const vendorData = vendors.map((v) => {
            const leads = leadsPorVendedor.filter((l) => l.ownerId === v.id);
            const clients = clientesPorVendedor.filter((c) => c.vendedorId === v.id);
            const quotes = cotPorVendedor.filter((c) => c.vendedorId === v.id);
            const totalLeadEstado = (estado) => leads.filter((l) => l.estado === estado).reduce((acc, curr) => acc + curr._count, 0);
            const totalClienteEstado = (estado) => clients.filter((c) => c.estado === estado).reduce((acc, curr) => acc + curr._count, 0);
            const totalCotEtapa = (etapa) => quotes.filter((c) => c.etapa === etapa).reduce((acc, curr) => acc + curr._count, 0);
            const detalleLeads = Object.values(client_1.EstadoLead).map((estado) => ({
                estado: leadLabel[estado],
                total: totalLeadEstado(estado),
            }));
            const detalleClientes = Object.values(client_1.EstadoCliente).map((estado) => ({
                estado: clienteLabel[estado],
                total: totalClienteEstado(estado),
            }));
            const detalleCotizaciones = Object.values(client_1.EtapaCotizacion).map((etapa) => ({
                etapa: etapaLabel[etapa],
                total: totalCotEtapa(etapa),
            }));
            return {
                id: v.id,
                nombre: v.nombre,
                email: v.email,
                rol: v.rol,
                leads: {
                    total: detalleLeads.reduce((a, b) => a + b.total, 0),
                    porEstado: detalleLeads,
                },
                clientes: {
                    total: detalleClientes.reduce((a, b) => a + b.total, 0),
                    porEstado: detalleClientes,
                },
                cotizaciones: {
                    total: detalleCotizaciones.reduce((a, b) => a + b.total, 0),
                    porEtapa: detalleCotizaciones,
                },
                recientes: {
                    leads: ultimosLeads
                        .filter((l) => l.ownerId === v.id)
                        .slice(0, 3)
                        .map((l) => ({
                        id: l.id,
                        nombre: l.nombre,
                        estado: leadLabel[l.estado],
                        resumen: l.resumen,
                        telefono: l.telefono,
                        correo: l.correo,
                        proximoPaso: l.proximoPaso,
                    })),
                    cotizaciones: ultimasCotizaciones
                        .filter((c) => c.vendedorId === v.id)
                        .slice(0, 3)
                        .map((c) => ({
                        id: c.id,
                        codigo: c.codigo,
                        etapa: etapaLabel[c.etapa],
                        cliente: c.cliente,
                        entregaProgramada: c.entregaProgramada,
                        resumen: c.resumen,
                        total: c.total,
                    })),
                },
            };
        });
        return res.json({
            resumen: {
                leads: leadEstados.reduce((acc, curr) => acc + curr._count, 0),
                clientes: clientesEstados.reduce((acc, curr) => acc + curr._count, 0),
                cotizaciones: cotEtapas.reduce((acc, curr) => acc + curr._count, 0),
            },
            leadsPorEstado: Object.values(client_1.EstadoLead).map((estado) => ({
                estado: leadLabel[estado],
                total: leadEstados.find((l) => l.estado === estado)?._count ?? 0,
            })),
            clientesPorEstado: Object.values(client_1.EstadoCliente).map((estado) => ({
                estado: clienteLabel[estado],
                total: clientesEstados.find((c) => c.estado === estado)?._count ?? 0,
            })),
            cotizacionesPorEtapa: Object.values(client_1.EtapaCotizacion).map((etapa) => ({
                etapa: etapaLabel[etapa],
                total: cotEtapas.find((c) => c.etapa === etapa)?._count ?? 0,
            })),
            vendors: vendorData,
            ultimaActualizacion: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error("adminDashboard error", err);
        return res.status(500).json({ message: "No se pudo cargar el dashboard" });
    }
}
async function supervisorDashboard(req, res) {
    // Por ahora usa la misma informacion completa que admin.
    return adminDashboard(req, res);
}
async function bodegaDashboard(_req, res) {
    try {
        const resumen = await prisma_1.prisma.cotizacion.groupBy({ by: ["etapa"], _count: true });
        const entregas = await prisma_1.prisma.cotizacion.findMany({
            where: { entregaProgramada: { not: null } },
            select: {
                id: true,
                codigo: true,
                cliente: true,
                etapa: true,
                entregaProgramada: true,
                comentarios: true,
                imagenUrl: true,
            },
            orderBy: { entregaProgramada: "asc" },
            take: 20,
        });
        const recientes = await prisma_1.prisma.cotizacion.findMany({
            select: {
                id: true,
                codigo: true,
                cliente: true,
                etapa: true,
                resumen: true,
                imagenUrl: true,
                comentarios: true,
                entregaProgramada: true,
            },
            orderBy: { id: "desc" },
            take: 20,
        });
        return res.json({
            cotizacionesPorEtapa: Object.values(client_1.EtapaCotizacion).map((etapa) => ({
                etapa: etapaLabel[etapa],
                total: resumen.find((r) => r.etapa === etapa)?._count ?? 0,
            })),
            entregas,
            recientes,
            ultimaActualizacion: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error("bodegaDashboard error", err);
        return res.status(500).json({ message: "No se pudo cargar panel de bodega" });
    }
}
