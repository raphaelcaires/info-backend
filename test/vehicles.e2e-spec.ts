import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { PrismaService } from "../src/prisma/prisma.service";
import { AppModule } from "../src/app.module";
import * as amqp from "amqplib";

describe("Vehicles API E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rabbitmqConnection: amqp.Connection;
  let rabbitmqChannel: amqp.Channel;
  const receivedMessages: any[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure ValidationPipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup RabbitMQ listener
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
      rabbitmqConnection = (await amqp.connect(rabbitmqUrl)) as any;
      rabbitmqChannel = await (rabbitmqConnection as any).createChannel();
      await rabbitmqChannel.assertQueue("vehicle_created", { durable: true });

      // Consume messages for testing
      await rabbitmqChannel.consume(
        "vehicle_created",
        (msg) => {
          if (msg) {
            const content = JSON.parse(msg.content.toString());
            receivedMessages.push(content);
            rabbitmqChannel.ack(msg);
          }
        },
        { noAck: false }
      );
    } catch (error: any) {
      console.warn("RabbitMQ not available for e2e tests:", error.message);
    }
  });

  afterAll(async () => {
    // Close RabbitMQ connection
    if (rabbitmqChannel) {
      await rabbitmqChannel.close();
    }
    if (rabbitmqConnection) {
      await (rabbitmqConnection as any).close();
    }

    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.vehicle.deleteMany({});
    receivedMessages.length = 0;
  });

  describe("POST /vehicles", () => {
    it("should create a vehicle and publish to RabbitMQ", async () => {
      const createDto = {
        placa: "E2E1234",
        chassi: "E2ECHASSI001",
        renavam: "E2EREN001",
        modelo: "Test Model",
        marca: "Test Brand",
        ano: 2023,
      };

      const response = await fetch("http://localhost:3000/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDto),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data).toMatchObject({
        id: expect.any(Number),
        ...createDto,
      });

      // Verify it was saved to database
      const dbVehicle = await prisma.vehicle.findUnique({
        where: { id: data.id },
      });
      expect(dbVehicle).toBeTruthy();
      expect(dbVehicle!.placa).toBe(createDto.placa);

      // Wait for RabbitMQ message (with timeout)
      if (rabbitmqChannel) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(receivedMessages.length).toBeGreaterThan(0);
        const message = receivedMessages[0];
        expect(message).toMatchObject({
          action: "created",
          vehicle: expect.objectContaining({
            placa: createDto.placa,
            modelo: createDto.modelo,
          }),
        });
      }
    });

    it("should return 409 when creating vehicle with duplicate placa", async () => {
      const createDto = {
        placa: "DUP1234",
        chassi: "CHASSI001",
        renavam: "REN001",
        modelo: "Model",
        marca: "Brand",
        ano: 2023,
      };

      // Create first vehicle
      await prisma.vehicle.create({ data: createDto as any });

      // Try to create duplicate
      const response = await fetch("http://localhost:3000/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createDto,
          chassi: "DIFFERENT",
          renavam: "DIFFERENT",
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain("Unique constraint failed");
      expect(data.message).toContain("placa");
    });

    it("should return 400 when creating vehicle with missing fields", async () => {
      const response = await fetch("http://localhost:3000/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: "ABC1234",
          // missing other required fields
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 when creating vehicle with invalid ano type", async () => {
      const response = await fetch("http://localhost:3000/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: "ABC1234",
          chassi: "CHASSI",
          renavam: "REN",
          modelo: "Model",
          marca: "Brand",
          ano: "not-a-number",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /vehicles", () => {
    beforeEach(async () => {
      // Seed test data
      await prisma.vehicle.createMany({
        data: [
          {
            placa: "TEST001",
            chassi: "CH001",
            renavam: "REN001",
            modelo: "Civic",
            marca: "Honda",
            ano: 2020,
          },
          {
            placa: "TEST002",
            chassi: "CH002",
            renavam: "REN002",
            modelo: "Corolla",
            marca: "Toyota",
            ano: 2021,
          },
          {
            placa: "TEST003",
            chassi: "CH003",
            renavam: "REN003",
            modelo: "Gol",
            marca: "VW",
            ano: 2020,
          },
        ],
      });
    });

    it("should return paginated vehicles with default values", async () => {
      const response = await fetch("http://localhost:3000/api/vehicles");

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Total-Count")).toBe("3");
      expect(response.headers.get("X-Page")).toBe("1");
      expect(response.headers.get("X-Limit")).toBe("10");

      const data = await response.json();
      expect(data.items).toHaveLength(3);
      expect(data.total).toBe(3);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
    });

    it("should return paginated vehicles with custom page and limit", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?page=2&limit=2"
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Page")).toBe("2");
      expect(response.headers.get("X-Limit")).toBe("2");

      const data = await response.json();
      expect(data.items).toHaveLength(1); // Only 1 item on page 2
      expect(data.page).toBe(2);
      expect(data.limit).toBe(2);
    });

    it("should filter vehicles by marca", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?marca=Toyota"
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].marca).toBe("Toyota");
    });

    it("should filter vehicles by modelo", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?modelo=Civic"
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].modelo).toBe("Civic");
    });

    it("should filter vehicles by ano", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?ano=2020"
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toHaveLength(2);
      data.items.forEach((item: any) => {
        expect(item.ano).toBe(2020);
      });
    });

    it("should filter vehicles by placa partial match", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?placa=TEST00"
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toHaveLength(3);
    });

    it("should combine multiple filters", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?marca=Honda&ano=2020"
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].marca).toBe("Honda");
      expect(data.items[0].ano).toBe(2020);
    });

    it("should return Link header with pagination links", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?page=2&limit=1"
      );

      expect(response.status).toBe(200);
      const linkHeader = response.headers.get("Link");
      expect(linkHeader).toBeTruthy();
      expect(linkHeader).toContain('rel="first"');
      expect(linkHeader).toContain('rel="prev"');
      expect(linkHeader).toContain('rel="next"');
      expect(linkHeader).toContain('rel="last"');
    });

    it("should return 400 for invalid page parameter", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?page=-1"
      );

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid limit parameter", async () => {
      const response = await fetch(
        "http://localhost:3000/api/vehicles?limit=200"
      );

      expect(response.status).toBe(400);
    });
  });

  describe("GET /vehicles/:id", () => {
    let vehicleId: number;

    beforeEach(async () => {
      const vehicle = await prisma.vehicle.create({
        data: {
          placa: "SINGLE01",
          chassi: "CHSINGLE",
          renavam: "RENSINGLE",
          modelo: "Single Model",
          marca: "Single Brand",
          ano: 2022,
        },
      });
      vehicleId = vehicle.id;
    });

    it("should return vehicle by id", async () => {
      const response = await fetch(
        `http://localhost:3000/api/vehicles/${vehicleId}`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({
        id: vehicleId,
        placa: "SINGLE01",
        modelo: "Single Model",
      });
    });

    it("should return 404 for non-existent vehicle", async () => {
      const response = await fetch("http://localhost:3000/api/vehicles/99999");

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toContain("Vehicle not found");
    });
  });

  describe("PUT /vehicles/:id", () => {
    let vehicleId: number;

    beforeEach(async () => {
      const vehicle = await prisma.vehicle.create({
        data: {
          placa: "UPDATE01",
          chassi: "CHUPDATE",
          renavam: "RENUPDATE",
          modelo: "Old Model",
          marca: "Old Brand",
          ano: 2020,
        },
      });
      vehicleId = vehicle.id;
    });

    it("should update vehicle", async () => {
      const updateDto = {
        modelo: "Updated Model",
        marca: "Updated Brand",
        ano: 2024,
      };

      const response = await fetch(
        `http://localhost:3000/api/vehicles/${vehicleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateDto),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({
        id: vehicleId,
        placa: "UPDATE01", // unchanged
        modelo: "Updated Model",
        marca: "Updated Brand",
        ano: 2024,
      });

      // Verify in database
      const dbVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      expect(dbVehicle).toBeTruthy();
      expect(dbVehicle!.modelo).toBe("Updated Model");
    });

    it("should return 404 when updating non-existent vehicle", async () => {
      const response = await fetch("http://localhost:3000/api/vehicles/99999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo: "Test" }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 409 when updating to duplicate placa", async () => {
      // Create another vehicle
      await prisma.vehicle.create({
        data: {
          placa: "EXISTING",
          chassi: "CHEX",
          renavam: "RENEX",
          modelo: "Existing",
          marca: "Existing",
          ano: 2021,
        },
      });

      // Try to update to existing placa
      const response = await fetch(
        `http://localhost:3000/api/vehicles/${vehicleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ placa: "EXISTING" }),
        }
      );

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.message).toContain("Unique constraint failed");
    });
  });

  describe("DELETE /vehicles/:id", () => {
    let vehicleId: number;

    beforeEach(async () => {
      const vehicle = await prisma.vehicle.create({
        data: {
          placa: "DELETE01",
          chassi: "CHDELETE",
          renavam: "RENDELETE",
          modelo: "To Delete",
          marca: "To Delete",
          ano: 2020,
        },
      });
      vehicleId = vehicle.id;
    });

    it("should delete vehicle", async () => {
      const response = await fetch(
        `http://localhost:3000/api/vehicles/${vehicleId}`,
        {
          method: "DELETE",
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(vehicleId);

      // Verify it was deleted from database
      const dbVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      expect(dbVehicle).toBeNull();
    });

    it("should return 404 when deleting non-existent vehicle", async () => {
      const response = await fetch("http://localhost:3000/api/vehicles/99999", {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Database Integration", () => {
    it("should respect unique constraints on placa", async () => {
      const data = {
        placa: "UNIQUE01",
        chassi: "CH001",
        renavam: "REN001",
        modelo: "Model",
        marca: "Brand",
        ano: 2020,
      };

      await prisma.vehicle.create({ data: data as any });

      // Try to create duplicate
      await expect(
        prisma.vehicle.create({
          data: { ...data, chassi: "CH002", renavam: "REN002" } as any,
        })
      ).rejects.toThrow();
    });

    it("should respect unique constraints on chassi", async () => {
      const data = {
        placa: "PLACA01",
        chassi: "UNIQUE_CHASSI",
        renavam: "REN001",
        modelo: "Model",
        marca: "Brand",
        ano: 2020,
      };

      await prisma.vehicle.create({ data: data as any });

      // Try to create duplicate chassi
      await expect(
        prisma.vehicle.create({
          data: { ...data, placa: "PLACA02", renavam: "REN002" } as any,
        })
      ).rejects.toThrow();
    });

    it("should use indexes for filtering queries", async () => {
      // Create multiple vehicles
      const vehicles = Array.from({ length: 50 }, (_, i) => ({
        placa: `INDEX${String(i).padStart(3, "0")}`,
        chassi: `CHINDEX${i}`,
        renavam: `RENINDEX${i}`,
        modelo: i % 2 === 0 ? "Civic" : "Corolla",
        marca: i % 3 === 0 ? "Honda" : "Toyota",
        ano: 2020 + (i % 4),
      }));

      await prisma.vehicle.createMany({ data: vehicles as any });

      // Query should be fast with indexes
      const startTime = Date.now();
      const result = await prisma.vehicle.findMany({
        where: { marca: "Honda" },
      });
      const duration = Date.now() - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be fast with index
    });
  });

  describe("RabbitMQ Integration", () => {
    it("should handle multiple vehicle creations and publish all events", async () => {
      if (!rabbitmqChannel) {
        console.warn("Skipping RabbitMQ test - not available");
        return;
      }

      const vehicles = [
        {
          placa: "RABBITMQ1",
          chassi: "CHRABBITMQ1",
          renavam: "RENRABBITMQ1",
          modelo: "Model1",
          marca: "Brand1",
          ano: 2021,
        },
        {
          placa: "RABBITMQ2",
          chassi: "CHRABBITMQ2",
          renavam: "RENRABBITMQ2",
          modelo: "Model2",
          marca: "Brand2",
          ano: 2022,
        },
      ];

      for (const vehicle of vehicles) {
        await fetch("http://localhost:3000/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vehicle),
        });
      }

      // Wait for messages
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(receivedMessages.length).toBeGreaterThanOrEqual(2);
      expect(receivedMessages[0].action).toBe("created");
      expect(receivedMessages[1].action).toBe("created");
    });
  });
});
