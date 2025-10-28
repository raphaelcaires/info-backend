import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { ListVehiclesDto } from "./dto/list-vehicles.dto";
import * as amqp from "amqplib";

@Injectable()
export class VehiclesService {
  private readonly exchange = "";
  private readonly queue = "vehicle_created";

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVehicleDto) {
    try {
      const created = await this.prisma.vehicle.create({
        data: createDto as any,
      });
      this.publishEvent({ action: "created", vehicle: created }).catch((e) =>
        console.error(e)
      );
      return created;
    } catch (err: any) {
      if (err && err.code === "P2002") {
        const fields = (err.meta && err.meta.target) || [];
        throw new (require("@nestjs/common").ConflictException)(
          `Unique constraint failed on the fields: ${fields.join(", ")}`
        );
      }
      throw err;
    }
  }

  async findAll(query?: ListVehiclesDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const where: any = {};
    if (query?.marca)
      where.marca = { contains: query.marca, mode: "insensitive" };
    if (query?.modelo)
      where.modelo = { contains: query.modelo, mode: "insensitive" };
    if (query?.placa)
      where.placa = { contains: query.placa, mode: "insensitive" };
    if (typeof query?.ano === "number") where.ano = query.ano;

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: "asc" },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException("Vehicle not found");
    return v;
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.findOne(id);
    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: dto as any,
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        const fields = (err.meta && err.meta.target) || [];
        throw new (require("@nestjs/common").ConflictException)(
          `Unique constraint failed on the fields: ${fields.join(", ")}`
        );
      }
      throw err;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  private async publishEvent(payload: any) {
    try {
      const conn = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://rabbitmq:5672"
      );
      const ch = await conn.createChannel();
      await ch.assertQueue(this.queue, { durable: true });
      ch.sendToQueue(this.queue, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
      });
      await ch.close();
      await conn.close();
    } catch (err) {
      console.error("Failed publish RabbitMQ event", err);
    }
  }
}
