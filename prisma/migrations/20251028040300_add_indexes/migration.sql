-- CreateIndex
CREATE INDEX "Vehicle_marca_idx" ON "Vehicle"("marca");

-- CreateIndex
CREATE INDEX "Vehicle_modelo_idx" ON "Vehicle"("modelo");

-- CreateIndex
CREATE INDEX "Vehicle_ano_idx" ON "Vehicle"("ano");

-- CreateIndex
CREATE INDEX "Vehicle_marca_modelo_idx" ON "Vehicle"("marca", "modelo");
