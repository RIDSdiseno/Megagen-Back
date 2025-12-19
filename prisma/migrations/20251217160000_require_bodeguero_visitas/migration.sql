-- Require bodegueroId on visitas y agregar índice por cliente
ALTER TABLE "VisitaTerreno"
ALTER COLUMN "bodegueroId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "VisitaTerreno_cliente_idx" ON "VisitaTerreno"("cliente");
