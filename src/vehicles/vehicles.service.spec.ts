import { Test, TestingModule } from "@nestjs/testing";
import { VehiclesService } from "./vehicles.service";
import { PrismaService } from "../prisma/prisma.service";

const mockPrisma = {
  vehicle: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findUnique: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
  },
};

describe("VehiclesService", () => {
  let service: VehiclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    jest.spyOn(service as any, "publishEvent").mockResolvedValue(undefined);
  });

  it("should create a vehicle", async () => {
    const res = await service.create({
      placa: "ABC1234",
      chassi: "CH123",
      renavam: "R123",
      modelo: "X",
      marca: "Y",
      ano: 2020,
    } as any);
    expect(res).toEqual({ id: 1 });
  });

  it("should throw ConflictException when create unique constraint fails", async () => {
    const p2002 = { code: "P2002", meta: { target: ["placa"] } } as any;
    mockPrisma.vehicle.create.mockRejectedValueOnce(p2002);
    await expect(
      service.create({
        placa: "DUP",
        chassi: "C",
        renavam: "R",
        modelo: "X",
        marca: "Y",
        ano: 2020,
      } as any)
    ).rejects.toThrow("Unique constraint failed");
  });

  it("should find all", async () => {
    const res = await service.findAll();
    expect(res).toEqual({ items: [], total: 0, page: 1, limit: 10 });
  });

  it("should throw NotFoundException when vehicle not found", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne(999)).rejects.toThrow("Vehicle not found");
  });
});
