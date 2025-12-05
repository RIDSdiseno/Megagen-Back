const {
  PrismaClient,
  RolUsuario,
  EstadoUsuario,
  EstadoLead,
  EstadoCliente,
  EtapaCotizacion,
  EtapaOportunidad
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando SEED COMPLETO de Megagend...");

  /* ========================================
        1. USUARIOS
  ======================================== */
  const usuariosBase = [
    { nombre: "Super Admin", email: "superadmin@megagen.cl", rol: RolUsuario.ADMINISTRADOR, estado: EstadoUsuario.ACTIVO, password: "Super!2025" },
    { nombre: "Admin MegaGen", email: "admin@megagen.cl", rol: RolUsuario.ADMINISTRADOR, estado: EstadoUsuario.ACTIVO, password: "Admin!2025" },
    { nombre: "Supervisor MegaGen", email: "supervisor@megagen.cl", rol: RolUsuario.SUPERVISOR, estado: EstadoUsuario.ACTIVO, password: "Sup!2025" },
    { nombre: "Supervisor Norte", email: "supervisor.norte@megagen.cl", rol: RolUsuario.SUPERVISOR, estado: EstadoUsuario.ACTIVO, password: "SupN!2025" },
    { nombre: "Vendedor MegaGen", email: "vendedor@megagen.cl", rol: RolUsuario.VENDEDOR, estado: EstadoUsuario.ACTIVO, password: "Vend!2025" },
    { nombre: "Vendedor Sur", email: "vendedor.sur@megagen.cl", rol: RolUsuario.VENDEDOR, estado: EstadoUsuario.ACTIVO, password: "VendS!2025" },
    { nombre: "Trabajador Bodega", email: "bodega@megagen.cl", rol: RolUsuario.TRABAJADOR, estado: EstadoUsuario.ACTIVO, password: "Bod!2025" },
    { nombre: "Trabajador Soporte", email: "soporte@megagen.cl", rol: RolUsuario.TRABAJADOR, estado: EstadoUsuario.ACTIVO, password: "Supp!2025" }
  ];

  const usuarios = {};
  for (const user of usuariosBase) {
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, ultimoAcceso: new Date() },
      create: { ...user, ultimoAcceso: new Date() }
    });
    usuarios[user.rol] = saved;
  }

  const vendedor = usuarios[RolUsuario.VENDEDOR];
  const supervisor = usuarios[RolUsuario.SUPERVISOR];

  /* ========================================
        2. LEADS
  ======================================== */
  await prisma.lead.deleteMany();

  const leads = await prisma.lead.createMany({
    data: [
      {
        nombre: "Juan Pérez",
        telefono: "+56977778888",
        correo: "juan.perez@test.com",
        estado: EstadoLead.NUEVO,
        resumen: "Interesado en implantes premium",
        origen: "WhatsApp",
        proximoPaso: "Enviar catálogo inicial",
        nota: "Sigue muy motivado",
        ownerId: vendedor.id
      },
      {
        nombre: "María Torres",
        telefono: "+56966664444",
        correo: "maria.torres@test.com",
        estado: EstadoLead.COTIZANDO,
        resumen: "Busca descuentos por volumen",
        origen: "Correo",
        proximoPaso: "Enviar cotización actualizada",
        nota: "Compra probable esta semana",
        ownerId: vendedor.id
      },
      {
        nombre: "Clínica DentalSur",
        telefono: "+56222446688",
        correo: "contacto@dentalsur.cl",
        estado: EstadoLead.EN_PROCESO,
        resumen: "Necesitan abastecimiento mensual",
        origen: "Referido",
        proximoPaso: "Agendar reunión técnica",
        nota: "Proyecto de largo plazo",
        ownerId: supervisor.id
      }
    ]
  });

  const lead1 = await prisma.lead.findFirst({ where: { nombre: "Juan Pérez" } });
  const lead2 = await prisma.lead.findFirst({ where: { nombre: "María Torres" } });
  const lead3 = await prisma.lead.findFirst({ where: { nombre: "Clínica DentalSur" } });

  /* ========================================
        3. CLIENTES
  ======================================== */
  await prisma.cliente.deleteMany();

  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: "Clínica Smile",
      correo: "contacto@smile.cl",
      telefono: "+56999998888",
      estado: EstadoCliente.ACTIVO,
      origen: "Leads",
      carpeta: "A01",
      vendedorId: vendedor.id
    }
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: "OdontoPlus SPA",
      correo: "contacto@odontoplus.cl",
      telefono: "+56961223344",
      estado: EstadoCliente.ONBOARDING,
      origen: "Web",
      carpeta: "A02",
      vendedorId: supervisor.id
    }
  });

  /* ========================================
        4. COTIZACIONES + HISTORIAL + ARCHIVOS
  ======================================== */

  await prisma.cotizacionEstadoLog.deleteMany();
  await prisma.cotizacionArchivo.deleteMany();
  await prisma.cotizacion.deleteMany();

  const cot1 = await prisma.cotizacion.create({
    data: {
      codigo: "COT-700",
      cliente: cliente2.nombre,
      total: "$6.500.018",
      etapa: EtapaCotizacion.DESPACHO,
      resumen: "Implantes Parallel Implant ZM 3.75L 10 mm (100u).",
      direccion: "AV Ramon Picarte 427, Oficina 409, Valdivia",
      comentarios: "Despacho urgente",
      leadId: lead1.id,
      vendedorId: vendedor.id,
      archivos: {
        create: [
          { nombre: "cotizacion_700.pdf", url: "cotizacion_700.pdf" }
        ]
      }
    }
  });

  await prisma.cotizacionEstadoLog.createMany({
    data: [
      {
        cotizacionId: cot1.id,
        etapa: EtapaCotizacion.COTIZACION_CONFIRMADA,
        nota: "Cotización ingresada",
        autorId: supervisor.id
      },
      {
        cotizacionId: cot1.id,
        etapa: EtapaCotizacion.DESPACHO,
        nota: "Aprobada y enviada a despacho",
        autorId: supervisor.id
      }
    ]
  });

  const cot2 = await prisma.cotizacion.create({
    data: {
      codigo: "COT-205",
      cliente: cliente1.nombre,
      total: "$1.180.000",
      etapa: EtapaCotizacion.TRANSITO,
      resumen: "Kit de implantes + laboratorio",
      direccion: "Av. América 2280, Conchalí",
      comentarios: "Confirmar recepción",
      entregaProgramada: new Date(),
      leadId: lead2.id,
      vendedorId: vendedor.id,
      archivos: {
        create: [
          { nombre: "Cotizacion_205.pdf", url: "Cotizacion_205.pdf" },
          { nombre: "OrdenCompra.png", url: "OrdenCompra.png" }
        ]
      }
    }
  });

  await prisma.cotizacionEstadoLog.createMany({
    data: [
      {
        cotizacionId: cot2.id,
        etapa: EtapaCotizacion.COTIZACION_CONFIRMADA,
        nota: "Cotización aprobada",
        autorId: supervisor.id
      },
      {
        cotizacionId: cot2.id,
        etapa: EtapaCotizacion.TRANSITO,
        nota: "Despacho enviado",
        autorId: supervisor.id
      }
    ]
  });

  /* ========================================
        5. VENTAS
  ======================================== */
  await prisma.venta.deleteMany();

  await prisma.venta.createMany({
    data: [
      {
        cliente: cliente2.nombre,
        monto: 6500018,
        moneda: "CLP",
        nota: "Venta generada desde COT-700",
        vendedorId: vendedor.id,
        leadId: lead1.id,
        cotizacionId: cot1.id
      },
      {
        cliente: cliente1.nombre,
        monto: 1180000,
        moneda: "CLP",
        nota: "Venta generada desde COT-205",
        vendedorId: vendedor.id,
        leadId: lead2.id,
        cotizacionId: cot2.id
      }
    ]
  });

  /* ========================================
        6. OPORTUNIDADES
  ======================================== */

  await prisma.oportunidad.deleteMany();

  await prisma.oportunidad.createMany({
    data: [
      {
        cliente: cliente1.nombre,
        etapa: EtapaOportunidad.CALIFICADO,
        monto: 2500000,
        moneda: "CLP",
        leadId: lead1.id,
        vendedorId: vendedor.id
      },
      {
        cliente: cliente2.nombre,
        etapa: EtapaOportunidad.NEGOCIACION,
        monto: 7000000,
        moneda: "CLP",
        leadId: lead2.id,
        vendedorId: supervisor.id
      }
    ]
  });

  /* ========================================
        7. CITAS
  ======================================== */

  await prisma.cita.deleteMany();

  await prisma.cita.createMany({
    data: [
      {
        titulo: "Reunión técnica inicial",
        descripcion: "Explicación de productos de implantes",
        inicio: new Date(),
        fin: new Date(Date.now() + 60 * 60000),
        leadId: lead3.id,
        vendedorId: supervisor.id
      },
      {
        titulo: "Presentación de cotización",
        descripcion: "Revisar detalles de COT-205",
        inicio: new Date(),
        fin: new Date(Date.now() + 30 * 60000),
        leadId: lead2.id,
        vendedorId: vendedor.id
      }
    ]
  });

  /* ========================================
        8. ARCHIVOS ASOCIADOS A LEADS / CLIENTES
  ======================================== */

  await prisma.archivo.deleteMany();

  await prisma.archivo.createMany({
    data: [
      { nombre: "rx_juan_1.png", url: "rx_juan_1.png", leadId: lead1.id },
      { nombre: "examen_maria.pdf", url: "examen_maria.pdf", leadId: lead2.id },
      { nombre: "ficha_cliente_smile.pdf", url: "ficha_smile.pdf", clienteId: cliente1.id }
    ]
  });

  /* ========================================
        9. DASHBOARD
  ======================================== */

  await prisma.dashboardSnapshot.createMany({
    data: [
      { etiqueta: "ventasMes", valor: "12", periodo: "2025-01" },
      { etiqueta: "leadsNuevos", valor: "8", periodo: "2025-01" },
      { etiqueta: "cotizacionesActivas", valor: "5", periodo: "2025-01" }
    ]
  });

  /* ========================================
        10. KPIs
  ======================================== */

  await prisma.kpiSnapshot.createMany({
    data: [
      { nombre: "Tasa Cierre", valor: "42%", unidad: "%", periodo: "2025-01" },
      { nombre: "Ticket Promedio", valor: "$850.000", unidad: "CLP", periodo: "2025-01" },
      { nombre: "Oportunidades Activas", valor: "7", periodo: "2025-01" }
    ]
  });

  console.log("SEED COMPLETO FINALIZADO CON ÉXITO.");
}

main()
  .catch((e) => {
    console.error(" ERROR EN SEED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
