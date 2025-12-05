-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'TRABAJADOR', 'SUPERVISOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'PENDIENTE', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'COTIZANDO', 'EN_PROCESO', 'CONFIRMADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('ACTIVO', 'ONBOARDING', 'EN_RIESGO');

-- CreateEnum
CREATE TYPE "EtapaCotizacion" AS ENUM ('COTIZACION_CONFIRMADA', 'DESPACHO', 'TRANSITO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "EtapaOportunidad" AS ENUM ('PROSPECTO', 'CALIFICADO', 'PROPUESTA', 'NEGOCIACION', 'CERRADO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'VENDEDOR',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'PENDIENTE',
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "estado" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "resumen" TEXT,
    "origen" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximoPaso" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "estado" "EstadoCliente" NOT NULL DEFAULT 'ACTIVO',
    "origen" TEXT,
    "carpeta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendedorId" INTEGER,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "total" TEXT NOT NULL,
    "etapa" "EtapaCotizacion" NOT NULL DEFAULT 'COTIZACION_CONFIRMADA',
    "resumen" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direccion" TEXT,
    "comentarios" TEXT,
    "entregaProgramada" TIMESTAMP(3),
    "imagenUrl" TEXT,
    "vendedorId" INTEGER,
    "leadId" INTEGER,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "cliente" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendedorId" INTEGER,
    "leadId" INTEGER,
    "cotizacionId" INTEGER,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oportunidad" (
    "id" SERIAL NOT NULL,
    "cliente" TEXT NOT NULL,
    "etapa" "EtapaOportunidad" NOT NULL DEFAULT 'PROSPECTO',
    "monto" DECIMAL(14,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "diasEnEtapa" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" INTEGER,
    "vendedorId" INTEGER,

    CONSTRAINT "Oportunidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoLead",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" INTEGER,
    "vendedorId" INTEGER,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" INTEGER,
    "clienteId" INTEGER,
    "cotizacionId" INTEGER,

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" SERIAL NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "periodo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "unidad" TEXT,
    "periodo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionArchivo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cotizacionId" INTEGER NOT NULL,

    CONSTRAINT "CotizacionArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionEstadoLog" (
    "id" SERIAL NOT NULL,
    "etapa" "EtapaCotizacion" NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cotizacionId" INTEGER NOT NULL,
    "autorId" INTEGER,

    CONSTRAINT "CotizacionEstadoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reunion" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoLead",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" INTEGER,
    "vendedorId" INTEGER,

    CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Lead_estado_idx" ON "Lead"("estado");

-- CreateIndex
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");

-- CreateIndex
CREATE INDEX "Cliente_estado_idx" ON "Cliente"("estado");

-- CreateIndex
CREATE INDEX "Cliente_vendedorId_idx" ON "Cliente"("vendedorId");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_codigo_key" ON "Cotizacion"("codigo");

-- CreateIndex
CREATE INDEX "Venta_vendedorId_idx" ON "Venta"("vendedorId");

-- CreateIndex
CREATE INDEX "Venta_leadId_idx" ON "Venta"("leadId");

-- CreateIndex
CREATE INDEX "Venta_cotizacionId_idx" ON "Venta"("cotizacionId");

-- CreateIndex
CREATE INDEX "Oportunidad_etapa_idx" ON "Oportunidad"("etapa");

-- CreateIndex
CREATE INDEX "Oportunidad_vendedorId_idx" ON "Oportunidad"("vendedorId");

-- CreateIndex
CREATE INDEX "Oportunidad_leadId_idx" ON "Oportunidad"("leadId");

-- CreateIndex
CREATE INDEX "Cita_leadId_idx" ON "Cita"("leadId");

-- CreateIndex
CREATE INDEX "Cita_vendedorId_idx" ON "Cita"("vendedorId");

-- CreateIndex
CREATE INDEX "CotizacionEstadoLog_cotizacionId_idx" ON "CotizacionEstadoLog"("cotizacionId");

-- CreateIndex
CREATE INDEX "CotizacionEstadoLog_autorId_idx" ON "CotizacionEstadoLog"("autorId");

-- CreateIndex
CREATE INDEX "Reunion_leadId_idx" ON "Reunion"("leadId");

-- CreateIndex
CREATE INDEX "Reunion_vendedorId_idx" ON "Reunion"("vendedorId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oportunidad" ADD CONSTRAINT "Oportunidad_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oportunidad" ADD CONSTRAINT "Oportunidad_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivo" ADD CONSTRAINT "Archivo_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionArchivo" ADD CONSTRAINT "CotizacionArchivo_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionEstadoLog" ADD CONSTRAINT "CotizacionEstadoLog_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionEstadoLog" ADD CONSTRAINT "CotizacionEstadoLog_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reunion" ADD CONSTRAINT "Reunion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reunion" ADD CONSTRAINT "Reunion_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
