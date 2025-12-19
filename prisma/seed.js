const { PrismaClient, RolUsuario, EstadoUsuario, EstadoLead, EstadoCliente, EtapaCotizacion, EtapaOportunidad, TerrenoTipo, VisitaEstado } =
  require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

const users = [
  { nombre: "Super Admin", email: "superadmin@megagen.cl", rol: RolUsuario.ADMINISTRADOR, estado: EstadoUsuario.ACTIVO, password: "Super!2025" },
  { nombre: "Admin MegaGen", email: "admin@megagen.cl", rol: RolUsuario.ADMINISTRADOR, estado: EstadoUsuario.ACTIVO, password: "Admin!2025" },
  { nombre: "Supervisor Norte", email: "supervisor.norte@megagen.cl", rol: RolUsuario.SUPERVISOR, estado: EstadoUsuario.ACTIVO, password: "SupN!2025" },
  { nombre: "Vendedor Centro", email: "vendedor@megagen.cl", rol: RolUsuario.VENDEDOR, estado: EstadoUsuario.ACTIVO, password: "Vend!2025" },
  { nombre: "Vendedor Sur", email: "vendedor.sur@megagen.cl", rol: RolUsuario.VENDEDOR, estado: EstadoUsuario.ACTIVO, password: "VendS!2025" },
  { nombre: "Bodega Central", email: "bodega@megagen.cl", rol: RolUsuario.TRABAJADOR, estado: EstadoUsuario.ACTIVO, password: "Bod!2025" },
  { nombre: "Soporte", email: "soporte@megagen.cl", rol: RolUsuario.TRABAJADOR, estado: EstadoUsuario.ACTIVO, password: "Supp!2025" },
];

async function seed() {
  console.log("Ejecutando seed de Megagend...");

  const hashedUsers = {};
  for (const u of users) {
    const hashed = bcrypt.hashSync(u.password, SALT_ROUNDS);
    const saved = await prisma.user.upsert({
      where: { email: u.email },
      update: { ...u, password: hashed, ultimoAcceso: new Date() },
      create: { ...u, password: hashed, ultimoAcceso: new Date() },
    });
    hashedUsers[u.email] = saved;
  }

  await prisma.cotizacionEstadoLog.deleteMany();
  await prisma.cotizacionArchivo.deleteMany();
  await prisma.cotizacion.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.archivo.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.oportunidad.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.cliente.deleteMany();

  const leads = await prisma.lead.createMany({
    data: [
      {
        nombre: "Juan Perez",
        telefono: "+56977778888",
        correo: "juan.perez@test.com",
        estado: EstadoLead.NUEVO,
        resumen: "Interesado en implantes premium",
        origen: "WhatsApp",
        proximoPaso: "Enviar catalogo inicial",
        nota: "Motivado, pedir descuento volumen",
        ownerId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        nombre: "Maria Torres",
        telefono: "+56966664444",
        correo: "maria.torres@test.com",
        estado: EstadoLead.COTIZANDO,
        resumen: "Busca descuentos por volumen",
        origen: "Correo",
        proximoPaso: "Enviar cotizacion actualizada",
        nota: "Probable cierre esta semana",
        ownerId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        nombre: "Clinica DentalSur",
        telefono: "+56222446688",
        correo: "contacto@dentalsur.cl",
        estado: EstadoLead.EN_PROCESO,
        resumen: "Necesitan abastecimiento mensual",
        origen: "Referido",
        proximoPaso: "Agendar reunion tecnica",
        nota: "Proyecto largo plazo",
        ownerId: hashedUsers["vendedor.sur@megagen.cl"].id,
      },
    ],
  });

  const lead1 = await prisma.lead.findFirst({ where: { nombre: "Juan Perez" } });
  const lead2 = await prisma.lead.findFirst({ where: { nombre: "Maria Torres" } });
  const lead3 = await prisma.lead.findFirst({ where: { nombre: "Clinica DentalSur" } });

  const clientes = await prisma.cliente.createMany({
    data: [
      {
        nombre: "Clinica Smile",
        correo: "contacto@smile.cl",
        telefono: "+56999998888",
        estado: EstadoCliente.ACTIVO,
        origen: "Leads",
        carpeta: "A01",
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        nombre: "OdontoPlus SPA",
        correo: "contacto@odontoplus.cl",
        telefono: "+56961223344",
        estado: EstadoCliente.ONBOARDING,
        origen: "Web",
        carpeta: "A02",
        vendedorId: hashedUsers["vendedor.sur@megagen.cl"].id,
      },
      {
        nombre: "Centro Andes",
        correo: "info@andes.cl",
        telefono: "+56223440011",
        estado: EstadoCliente.EN_RIESGO,
        origen: "Referido",
        carpeta: "A03",
        vendedorId: hashedUsers["supervisor.norte@megagen.cl"].id,
      },
    ],
  });

  const cliente1 = await prisma.cliente.findFirst({ where: { nombre: "Clinica Smile" } });
  const cliente2 = await prisma.cliente.findFirst({ where: { nombre: "OdontoPlus SPA" } });
  const cliente3 = await prisma.cliente.findFirst({ where: { nombre: "Centro Andes" } });

  const cot1 = await prisma.cotizacion.create({
    data: {
      codigo: "COT-700",
      cliente: cliente2?.nombre || "OdontoPlus SPA",
      total: "$6.500.018",
      etapa: EtapaCotizacion.DESPACHO,
      resumen: "Implantes Parallel Implant ZM 3.75L 10 mm (100u).",
      direccion: "AV Ramon Picarte 427, Oficina 409, Valdivia",
      comentarios: "Despacho urgente",
      leadId: lead1?.id,
      vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      archivos: {
        create: [{ nombre: "cotizacion_700.pdf", url: "cotizacion_700.pdf" }],
      },
      historial: {
        create: [
          { etapa: EtapaCotizacion.COTIZACION_CONFIRMADA, nota: "Cotizacion ingresada", autorId: hashedUsers["supervisor.norte@megagen.cl"].id },
          { etapa: EtapaCotizacion.DESPACHO, nota: "Aprobada y enviada a despacho", autorId: hashedUsers["supervisor.norte@megagen.cl"].id },
        ],
      },
    },
  });

  const cot2 = await prisma.cotizacion.create({
    data: {
      codigo: "COT-205",
      cliente: cliente1?.nombre || "Clinica Smile",
      total: "$1.180.000",
      etapa: EtapaCotizacion.TRANSITO,
      resumen: "Kit de implantes + laboratorio",
      direccion: "Av. America 2280, Conchali",
      comentarios: "Confirmar recepcion",
      entregaProgramada: new Date(),
      leadId: lead2?.id,
      vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      archivos: {
        create: [
          { nombre: "Cotizacion_205.pdf", url: "Cotizacion_205.pdf" },
          { nombre: "OrdenCompra.png", url: "OrdenCompra.png" },
        ],
      },
      historial: {
        create: [
          { etapa: EtapaCotizacion.COTIZACION_CONFIRMADA, nota: "Cotizacion aprobada", autorId: hashedUsers["supervisor.norte@megagen.cl"].id },
          { etapa: EtapaCotizacion.TRANSITO, nota: "Despacho enviado", autorId: hashedUsers["supervisor.norte@megagen.cl"].id },
        ],
      },
    },
  });

  await prisma.terrenoHistorial.createMany({
    data: [
      {
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tipo: TerrenoTipo.SALIDA,
        titulo: "Salida a despacho zona norte",
        detalle: "Retiro de insumos y despacho a Clinica Smile",
        ubicacion: "Bodega Central",
        documento: "hoja_ruta_001.pdf",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot2.id,
      },
      {
        fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tipo: TerrenoTipo.ENTREGA,
        titulo: "Entrega parcial COT-700",
        detalle: "Se entrega primera parte del pedido, pendiente confirmar recepcion",
        ubicacion: "Valdivia",
        documento: "comprobante_entrega_700.png",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot1.id,
      },
      {
        fecha: new Date(),
        tipo: TerrenoTipo.DEVOLUCION,
        titulo: "Devolucion de guia anterior",
        detalle: "Cliente solicito cambio de aditamentos",
        ubicacion: "Providencia",
        documento: "devolucion_guia.pdf",
        bodegueroId: hashedUsers["soporte@megagen.cl"].id,
        cotizacionId: cot1.id,
      },
    ],
  });

  await prisma.visitaTerreno.createMany({
    data: [
      {
        fecha: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.PROGRAMADA,
        cliente: "Clinica Horizonte",
        direccion: "Los Olivos 2233, Nuñoa",
        motivo: "Validar recepción y armado de kit",
        resultado: "",
        comentarios: "Confirmar hora con odontologo",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot1.id,
      },
      {
        fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.COMPLETADA,
        cliente: "Centro Andes",
        direccion: "Av. Alemania 455, Temuco",
        motivo: "Entrega en terreno y confirmacion de stock",
        resultado: "Entrega realizada, cliente conforme",
        comentarios: "Adjuntar fotos en carpeta compartida",
        bodegueroId: hashedUsers["soporte@megagen.cl"].id,
        cotizacionId: cot2.id,
      },
      {
        fecha: new Date(),
        estado: VisitaEstado.EN_CURSO,
        cliente: "Clinica Smile",
        direccion: "Av. America 2280, Conchali",
        motivo: "Retiro de devoluciones y control de stock",
        resultado: "",
        comentarios: "Coordinar con supervisor norte",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot2.id,
      },
      {
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.CANCELADA,
        cliente: "Clinica Horizonte",
        direccion: "Los Olivos 2233, Nuñoa",
        motivo: "Visita de control de stock",
        resultado: "Cliente reagendó para próxima semana",
        comentarios: "Reprogramar con bodega central",
        bodegueroId: hashedUsers["soporte@megagen.cl"].id,
        cotizacionId: cot1.id,
      },
      {
        fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.COMPLETADA,
        cliente: "Dental Sur",
        direccion: "Av Alemania 455, Temuco",
        motivo: "Entrega completa de COT-304",
        resultado: "Firmado por recepcionista",
        comentarios: "Adjuntar comprobante",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot2.id,
      },
      {
        fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.PROGRAMADA,
        cliente: "OdontoPlus SPA",
        direccion: "Av. Apoquindo 4500, Las Condes",
        motivo: "Instalacion de kit guiado",
        resultado: "",
        comentarios: "Coordinar acceso a bodega local",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot1.id,
      },
      {
        fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.EN_CURSO,
        cliente: "Centro Maxilar",
        direccion: "Pedro de Valdivia 1000, Providencia",
        motivo: "Entrega parcial COT-302",
        resultado: "",
        comentarios: "Esperando firma de recepcion",
        bodegueroId: hashedUsers["soporte@megagen.cl"].id,
        cotizacionId: cot1.id,
      },
      {
        fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        estado: VisitaEstado.COMPLETADA,
        cliente: "Clinica Horizonte",
        direccion: "Los Olivos 2233, Nunoa",
        motivo: "Revision post entrega",
        resultado: "Cliente conforme, sin observaciones",
        comentarios: "Cargar fotos en drive",
        bodegueroId: hashedUsers["bodega@megagen.cl"].id,
        cotizacionId: cot2.id,
      },
    ],
  });

  // Cotizaciones adicionales (semilla rápida para pruebas)
  await prisma.cotizacion.createMany({
    data: [
      {
        codigo: "COT-301",
        cliente: "Clinica Horizonte",
        total: "$2.350.000",
        etapa: EtapaCotizacion.COTIZACION_CONFIRMADA,
        resumen: "Implantes + kit instrumental",
        direccion: "Los Olivos 2233, Ñuñoa",
        comentarios: "Cliente solicita entrega rapida",
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        codigo: "COT-302",
        cliente: "Centro Maxilar",
        total: "$1.540.000",
        etapa: EtapaCotizacion.DESPACHO,
        resumen: "Guías quirúrgicas",
        direccion: "Pedro de Valdivia 1000, Providencia",
        comentarios: "Despacho a primera hora",
        entregaProgramada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        vendedorId: hashedUsers["vendedor.sur@megagen.cl"].id,
      },
      {
        codigo: "COT-303",
        cliente: "Clinica Sonrisas",
        total: "$980.000",
        etapa: EtapaCotizacion.TRANSITO,
        resumen: "Reposición stock implantes",
        direccion: "Apoquindo 4500, Las Condes",
        comentarios: "Cliente en seguimiento semanal",
        entregaProgramada: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        codigo: "COT-304",
        cliente: "Dental Sur",
        total: "$1.120.000",
        etapa: EtapaCotizacion.ENTREGADO,
        resumen: "Línea económica + kits",
        direccion: "Av Alemania 455, Temuco",
        comentarios: "Entrega confirmada",
        vendedorId: hashedUsers["vendedor.sur@megagen.cl"].id,
      },
      {
        codigo: "COT-305",
        cliente: "Sonrisa Feliz",
        total: "$730.000",
        etapa: EtapaCotizacion.COTIZACION_CONFIRMADA,
        resumen: "Instrumental menor",
        direccion: "Portugal 155, Santiago",
        comentarios: "Enviar fotos de embalaje",
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        codigo: "COT-306",
        cliente: "Clínica Andes",
        total: "$1.820.000",
        etapa: EtapaCotizacion.DESPACHO,
        resumen: "Kit guiado + cirugía",
        direccion: "Baquedano 455, Antofagasta",
        comentarios: "Coordinar con bodega norte",
        vendedorId: hashedUsers["supervisor.norte@megagen.cl"].id,
      },
      {
        codigo: "COT-307",
        cliente: "Odonto Premium",
        total: "$2.050.000",
        etapa: EtapaCotizacion.TRANSITO,
        resumen: "Pedido mixto implantes + aditamentos",
        direccion: "Manuel Montt 1600, Providencia",
        comentarios: "Seguimiento diario",
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
    ],
  });

  await prisma.venta.createMany({
    data: [
      {
        cliente: cliente2?.nombre || "OdontoPlus SPA",
        monto: 6500018,
        moneda: "CLP",
        nota: "Venta generada desde COT-700",
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
        leadId: lead1?.id || null,
        cotizacionId: cot1.id,
      },
      {
        cliente: cliente1?.nombre || "Clinica Smile",
        monto: 1180000,
        moneda: "CLP",
        nota: "Venta generada desde COT-205",
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
        leadId: lead2?.id || null,
        cotizacionId: cot2.id,
      },
    ],
  });

  await prisma.oportunidad.createMany({
    data: [
      {
        cliente: cliente1?.nombre || "Clinica Smile",
        etapa: EtapaOportunidad.CALIFICADO,
        monto: 2500000,
        moneda: "CLP",
        leadId: lead1?.id || null,
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
      {
        cliente: cliente2?.nombre || "OdontoPlus SPA",
        etapa: EtapaOportunidad.NEGOCIACION,
        monto: 7000000,
        moneda: "CLP",
        leadId: lead2?.id || null,
        vendedorId: hashedUsers["supervisor.norte@megagen.cl"].id,
      },
    ],
  });

  await prisma.cita.createMany({
    data: [
      {
        titulo: "Reunion tecnica inicial",
        descripcion: "Explicacion de productos de implantes",
        inicio: new Date(),
        fin: new Date(Date.now() + 60 * 60000),
        leadId: lead3?.id || null,
        vendedorId: hashedUsers["supervisor.norte@megagen.cl"].id,
      },
      {
        titulo: "Presentacion de cotizacion",
        descripcion: "Revisar detalles de COT-205",
        inicio: new Date(),
        fin: new Date(Date.now() + 30 * 60000),
        leadId: lead2?.id || null,
        vendedorId: hashedUsers["vendedor@megagen.cl"].id,
      },
    ],
  });

  await prisma.archivo.createMany({
    data: [
      { nombre: "rx_juan_1.png", url: "rx_juan_1.png", leadId: lead1?.id || null },
      { nombre: "examen_maria.pdf", url: "examen_maria.pdf", leadId: lead2?.id || null },
      { nombre: "ficha_cliente_smile.pdf", url: "ficha_smile.pdf", clienteId: cliente1?.id || null },
    ],
  });

  await prisma.dashboardSnapshot.createMany({
    data: [
      { etiqueta: "ventasMes", valor: "12", periodo: "2025-01" },
      { etiqueta: "leadsNuevos", valor: "8", periodo: "2025-01" },
      { etiqueta: "cotizacionesActivas", valor: "5", periodo: "2025-01" },
    ],
  });

  await prisma.kpiSnapshot.createMany({
    data: [
      { nombre: "Tasa Cierre", valor: "42%", unidad: "%", periodo: "2025-01" },
      { nombre: "Ticket Promedio", valor: "$850.000", unidad: "CLP", periodo: "2025-01" },
      { nombre: "Oportunidades Activas", valor: "7", periodo: "2025-01" },
    ],
  });

  console.log("Seed completo OK");
}

seed()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
