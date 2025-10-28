import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    VehiclesModule,
  ],
})
export class AppModule {}
