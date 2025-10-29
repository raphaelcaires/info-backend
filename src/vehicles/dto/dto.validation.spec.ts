import "reflect-metadata";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { UpdateVehicleDto } from "./update-vehicle.dto";
import { ListVehiclesDto } from "./list-vehicles.dto";

describe("DTO Validation", () => {
  describe("CreateVehicleDto", () => {
    it("should validate valid vehicle data", async () => {
      const dto = plainToClass(CreateVehicleDto, {
        placa: "ABC1234",
        chassi: "CHASSI123",
        renavam: "REN123",
        modelo: "Civic",
        marca: "Honda",
        ano: 2020,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should fail when placa is missing", async () => {
      const dto = plainToClass(CreateVehicleDto, {
        chassi: "CHASSI123",
        renavam: "REN123",
        modelo: "Civic",
        marca: "Honda",
        ano: 2020,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("placa");
    });

    it("should fail when ano is not a number", async () => {
      const dto = plainToClass(CreateVehicleDto, {
        placa: "ABC1234",
        chassi: "CHASSI123",
        renavam: "REN123",
        modelo: "Civic",
        marca: "Honda",
        ano: "not-a-number" as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const anoError = errors.find((e) => e.property === "ano");
      expect(anoError).toBeDefined();
    });

    it("should fail when placa is not a string", async () => {
      const dto = plainToClass(CreateVehicleDto, {
        placa: 12345 as any,
        chassi: "CHASSI123",
        renavam: "REN123",
        modelo: "Civic",
        marca: "Honda",
        ano: 2020,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const placaError = errors.find((e) => e.property === "placa");
      expect(placaError).toBeDefined();
    });
  });

  describe("UpdateVehicleDto", () => {
    it("should validate partial update data", async () => {
      const dto = plainToClass(UpdateVehicleDto, {
        modelo: "New Model",
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should validate when all fields are provided", async () => {
      const dto = plainToClass(UpdateVehicleDto, {
        placa: "XYZ9999",
        chassi: "NEWCHASSI",
        renavam: "NEWREN",
        modelo: "Updated",
        marca: "Updated Brand",
        ano: 2023,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should fail when ano is invalid", async () => {
      const dto = plainToClass(UpdateVehicleDto, {
        ano: "invalid" as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const anoError = errors.find((e) => e.property === "ano");
      expect(anoError).toBeDefined();
    });
  });

  describe("ListVehiclesDto", () => {
    it("should validate valid query params with type conversion", async () => {
      const dto = new ListVehiclesDto();
      dto.page = 2;
      dto.limit = 15;
      dto.marca = "Toyota";
      dto.modelo = "Corolla";
      dto.ano = 2020;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(15);
      expect(dto.ano).toBe(2020);
    });

    it("should use default values when params are missing", async () => {
      const dto = new ListVehiclesDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should fail when page is negative", async () => {
      const dto = new ListVehiclesDto();
      dto.page = -1;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === "page");
      expect(pageError).toBeDefined();
    });

    it("should fail when page is zero", async () => {
      const dto = new ListVehiclesDto();
      dto.page = 0;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find((e) => e.property === "page");
      expect(pageError).toBeDefined();
    });

    it("should fail when limit exceeds maximum", async () => {
      const dto = new ListVehiclesDto();
      dto.limit = 200;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === "limit");
      expect(limitError).toBeDefined();
    });

    it("should fail when limit is zero", async () => {
      const dto = new ListVehiclesDto();
      dto.limit = 0;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const limitError = errors.find((e) => e.property === "limit");
      expect(limitError).toBeDefined();
    });

    it("should accept optional filter params", async () => {
      const dto = new ListVehiclesDto();
      dto.marca = "Honda";
      dto.modelo = "Civic";
      dto.placa = "ABC";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.marca).toBe("Honda");
      expect(dto.modelo).toBe("Civic");
      expect(dto.placa).toBe("ABC");
    });
  });
});
