import { VehiclesController } from "./vehicles.controller";
import { NotFoundException } from "@nestjs/common";
import type { Request, Response } from "express";

describe("VehiclesController", () => {
  let controller: VehiclesController;
  const mockSvc = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    controller = new VehiclesController(mockSvc as any);
  });

  afterEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("should call service.create and return created vehicle", async () => {
      const dto = {
        placa: "ABC1234",
        chassi: "CH123",
        renavam: "R123",
        modelo: "X",
        marca: "Y",
        ano: 2020,
      } as any;
      mockSvc.create.mockResolvedValue({ id: 1, ...dto });
      await expect(controller.create(dto)).resolves.toEqual({ id: 1, ...dto });
      expect(mockSvc.create).toHaveBeenCalledWith(dto);
    });

    it("should propagate ConflictException on duplicate", async () => {
      const dto = { placa: "ABC1234" } as any;
      const error = new Error("Conflict");
      (error as any).status = 409;
      mockSvc.create.mockRejectedValue(error);
      await expect(controller.create(dto)).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    it("should return paginated results without query params", async () => {
      mockSvc.findAll.mockResolvedValue({
        items: [{ id: 1 }, { id: 2 }],
        total: 20,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll();

      expect(result).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        total: 20,
        page: 1,
        limit: 10,
      });
      expect(mockSvc.findAll).toHaveBeenCalledWith(undefined);
    });

    it("should accept page and limit query params", async () => {
      mockSvc.findAll.mockResolvedValue({
        items: [{ id: 11 }],
        total: 20,
        page: 2,
        limit: 5,
      });

      const query = { page: 2, limit: 5 };
      const result = await controller.findAll(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockSvc.findAll).toHaveBeenCalledWith(query);
    });

    it("should accept filter params (marca, modelo, placa, ano)", async () => {
      mockSvc.findAll.mockResolvedValue({
        items: [{ id: 1, marca: "Toyota" }],
        total: 1,
        page: 1,
        limit: 10,
      });

      const query = { marca: "Toyota" };
      await controller.findAll(query);

      expect(mockSvc.findAll).toHaveBeenCalledWith(query);
    });

    it("should set pagination headers when res is provided", async () => {
      mockSvc.findAll.mockResolvedValue({
        items: [],
        total: 20,
        page: 2,
        limit: 10,
      });

      const mockRes = {
        setHeader: jest.fn(),
      } as unknown as Response;

      const mockReq = {
        path: "/api/vehicles",
      } as unknown as Request;

      await controller.findAll({}, mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith("X-Total-Count", "20");
      expect(mockRes.setHeader).toHaveBeenCalledWith("X-Page", "2");
      expect(mockRes.setHeader).toHaveBeenCalledWith("X-Limit", "10");
    });

    it("should set Link header with pagination links", async () => {
      mockSvc.findAll.mockResolvedValue({
        items: [],
        total: 30,
        page: 2,
        limit: 10,
      });

      const mockRes = {
        setHeader: jest.fn(),
      } as unknown as Response;

      const mockReq = {
        path: "/api/vehicles",
      } as unknown as Request;

      await controller.findAll({ page: 2, limit: 10 }, mockReq, mockRes);

      const linkCall = (mockRes.setHeader as jest.Mock).mock.calls.find(
        (call) => call[0] === "Link"
      );
      expect(linkCall).toBeDefined();
      expect(linkCall[1]).toContain('rel="first"');
      expect(linkCall[1]).toContain('rel="prev"');
      expect(linkCall[1]).toContain('rel="next"');
      expect(linkCall[1]).toContain('rel="last"');
    });
  });

  describe("findOne", () => {
    it("should return single vehicle by id", async () => {
      mockSvc.findOne.mockResolvedValue({ id: 1, placa: "ABC1234" });
      await expect(controller.findOne(1)).resolves.toEqual({
        id: 1,
        placa: "ABC1234",
      });
      expect(mockSvc.findOne).toHaveBeenCalledWith(1);
    });

    it("should propagate NotFoundException when vehicle not found", async () => {
      mockSvc.findOne.mockRejectedValue(
        new NotFoundException("Vehicle not found")
      );
      await expect(controller.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    it("should call service.update and return updated vehicle", async () => {
      mockSvc.update.mockResolvedValue({ id: 1, modelo: "Updated" });
      await expect(
        controller.update(1, { modelo: "Updated" } as any)
      ).resolves.toEqual({ id: 1, modelo: "Updated" });
      expect(mockSvc.update).toHaveBeenCalledWith(1, { modelo: "Updated" });
    });

    it("should propagate NotFoundException when updating non-existent vehicle", async () => {
      mockSvc.update.mockRejectedValue(
        new NotFoundException("Vehicle not found")
      );
      await expect(controller.update(999, {} as any)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe("remove", () => {
    it("should call service.remove and return deleted vehicle", async () => {
      mockSvc.remove.mockResolvedValue({ id: 1 });
      await expect(controller.remove(1)).resolves.toEqual({ id: 1 });
      expect(mockSvc.remove).toHaveBeenCalledWith(1);
    });

    it("should propagate NotFoundException when deleting non-existent vehicle", async () => {
      mockSvc.remove.mockRejectedValue(
        new NotFoundException("Vehicle not found")
      );
      await expect(controller.remove(999)).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });
});
