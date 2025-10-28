import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const vehicles = [
    {
      placa: "AAA1A11",
      chassi: "CHASSI0001",
      renavam: "REN0001",
      modelo: "Gol",
      marca: "VW",
      ano: 2010,
    },
    {
      placa: "BBB2B22",
      chassi: "CHASSI0002",
      renavam: "REN0002",
      modelo: "Fiesta",
      marca: "Ford",
      ano: 2012,
    },
    {
      placa: "CCC3C33",
      chassi: "CHASSI0003",
      renavam: "REN0003",
      modelo: "Civic",
      marca: "Honda",
      ano: 2018,
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { placa: v.placa },
      update: v,
      create: v,
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
