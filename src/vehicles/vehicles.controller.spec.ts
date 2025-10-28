import { VehiclesController } from "./vehicles.controller";
import { NotFoundException } from "@nestjs/common";

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

  it("create should call service.create and return created vehicle", async () => {
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

  it("findAll should return array", async () => {
    mockSvc.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    await expect(controller.findAll()).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  });

  it("findOne should return single vehicle", async () => {
    mockSvc.findOne.mockResolvedValue({ id: 1 });
    await expect(controller.findOne(1)).resolves.toEqual({ id: 1 });
    expect(mockSvc.findOne).toHaveBeenCalledWith(1);
  });

  it("update should call service.update", async () => {
    mockSvc.update.mockResolvedValue({ id: 1 });
    await expect(controller.update(1, { modelo: "Z" } as any)).resolves.toEqual(
      { id: 1 }
    );
    expect(mockSvc.update).toHaveBeenCalledWith(1, { modelo: "Z" });
  });

  it("remove should call service.remove", async () => {
    mockSvc.remove.mockResolvedValue({ id: 1 });
    await expect(controller.remove(1)).resolves.toEqual({ id: 1 });
    expect(mockSvc.remove).toHaveBeenCalledWith(1);
  });

  it("findOne should propagate NotFoundException", async () => {
    mockSvc.findOne.mockRejectedValue(
      new NotFoundException("Vehicle not found")
    );
    await expect(controller.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
