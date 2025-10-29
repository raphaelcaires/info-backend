import { Test, TestingModule } from "@nestjs/testing";
import { VehiclesService } from "./vehicles.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

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
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a vehicle and publish event", async () => {
      const dto = {
        placa: "ABC1234",
        chassi: "CH123",
        renavam: "R123",
        modelo: "Civic",
        marca: "Honda",
        ano: 2020,
      } as any;
      const created = { id: 1, ...dto };
      mockPrisma.vehicle.create.mockResolvedValueOnce(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({ data: dto });
      expect((service as any).publishEvent).toHaveBeenCalledWith({
        action: "created",
        vehicle: created,
      });
    });

    it("should throw ConflictException on P2002 error (duplicate placa)", async () => {
      const p2002 = { code: "P2002", meta: { target: ["placa"] } } as any;
      mockPrisma.vehicle.create.mockRejectedValueOnce(p2002);

      await expect(
        service.create({
          placa: "DUP1234",
          chassi: "C",
          renavam: "R",
          modelo: "X",
          marca: "Y",
          ano: 2020,
        } as any)
      ).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException on P2002 error (duplicate chassi)", async () => {
      const p2002 = { code: "P2002", meta: { target: ["chassi"] } } as any;
      mockPrisma.vehicle.create.mockRejectedValueOnce(p2002);

      await expect(service.create({} as any)).rejects.toThrow(
        "Unique constraint failed on the fields: chassi"
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated results with defaults", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(2);

      const result = await service.findAll();

      expect(result).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { id: "asc" },
      });
      expect(mockPrisma.vehicle.count).toHaveBeenCalledWith({ where: {} });
    });

    it("should handle page and limit params", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([{ id: 11 }]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(20);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { id: "asc" },
      });
    });

    it("should filter by marca", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([
        { id: 1, marca: "Toyota" },
      ]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(1);

      await service.findAll({ marca: "Toyota" });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { marca: { contains: "Toyota", mode: "insensitive" } },
        skip: 0,
        take: 10,
        orderBy: { id: "asc" },
      });
    });

    it("should filter by modelo", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([
        { id: 1, modelo: "Civic" },
      ]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(1);

      await service.findAll({ modelo: "Civic" });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { modelo: { contains: "Civic", mode: "insensitive" } },
        skip: 0,
        take: 10,
        orderBy: { id: "asc" },
      });
    });

    it("should filter by placa", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([
        { id: 1, placa: "ABC1234" },
      ]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(1);

      await service.findAll({ placa: "ABC" });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { placa: { contains: "ABC", mode: "insensitive" } },
        skip: 0,
        take: 10,
        orderBy: { id: "asc" },
      });
    });

    it("should filter by ano", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([{ id: 1, ano: 2020 }]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(1);

      await service.findAll({ ano: 2020 });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { ano: 2020 },
        skip: 0,
        take: 10,
        orderBy: { id: "asc" },
      });
    });

    it("should combine multiple filters", async () => {
      mockPrisma.vehicle.findMany.mockResolvedValueOnce([]);
      mockPrisma.vehicle.count.mockResolvedValueOnce(0);

      await service.findAll({
        marca: "Toyota",
        modelo: "Corolla",
        ano: 2020,
        page: 2,
        limit: 5,
      });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {
          marca: { contains: "Toyota", mode: "insensitive" },
          modelo: { contains: "Corolla", mode: "insensitive" },
          ano: 2020,
        },
        skip: 5,
        take: 5,
        orderBy: { id: "asc" },
      });
    });
  });

  describe("findOne", () => {
    it("should return vehicle by id", async () => {
      const vehicle = { id: 1, placa: "ABC1234" };
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(vehicle);

      const result = await service.findOne(1);

      expect(result).toEqual(vehicle);
      expect(mockPrisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw NotFoundException when vehicle not found", async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update vehicle and return updated data", async () => {
      const existing = { id: 1, placa: "ABC1234", modelo: "Old" };
      const updated = { id: 1, placa: "ABC1234", modelo: "New" };
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.vehicle.update.mockResolvedValueOnce(updated);

      const result = await service.update(1, { modelo: "New" } as any);

      expect(result).toEqual(updated);
      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { modelo: "New" },
      });
    });

    it("should throw NotFoundException when updating non-existent vehicle", async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ConflictException on P2002 error during update", async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce({ id: 1 });
      const p2002 = { code: "P2002", meta: { target: ["placa"] } } as any;
      mockPrisma.vehicle.update.mockRejectedValueOnce(p2002);

      await expect(
        service.update(1, { placa: "DUP1234" } as any)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("remove", () => {
    it("should delete vehicle and return deleted data", async () => {
      const vehicle = { id: 1, placa: "ABC1234" };
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(vehicle);
      mockPrisma.vehicle.delete.mockResolvedValueOnce(vehicle);

      const result = await service.remove(1);

      expect(result).toEqual(vehicle);
      expect(mockPrisma.vehicle.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw NotFoundException when deleting non-existent vehicle", async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
