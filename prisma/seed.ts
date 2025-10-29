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
    {
      placa: "DDD4D44",
      chassi: "CHASSI0004",
      renavam: "REN0004",
      modelo: "Corolla",
      marca: "Toyota",
      ano: 2020,
    },
    {
      placa: "EEE5E55",
      chassi: "CHASSI0005",
      renavam: "REN0005",
      modelo: "Onix",
      marca: "Chevrolet",
      ano: 2019,
    },
    {
      placa: "FFF6F66",
      chassi: "CHASSI0006",
      renavam: "REN0006",
      modelo: "HB20",
      marca: "Hyundai",
      ano: 2021,
    },
    {
      placa: "GGG7G77",
      chassi: "CHASSI0007",
      renavam: "REN0007",
      modelo: "Uno",
      marca: "Fiat",
      ano: 2015,
    },
    {
      placa: "HHH8H88",
      chassi: "CHASSI0008",
      renavam: "REN0008",
      modelo: "Ka",
      marca: "Ford",
      ano: 2017,
    },
    {
      placa: "III9I99",
      chassi: "CHASSI0009",
      renavam: "REN0009",
      modelo: "Fit",
      marca: "Honda",
      ano: 2016,
    },
    {
      placa: "JJJ0J00",
      chassi: "CHASSI0010",
      renavam: "REN0010",
      modelo: "Palio",
      marca: "Fiat",
      ano: 2014,
    },
    {
      placa: "KKK1K11",
      chassi: "CHASSI0011",
      renavam: "REN0011",
      modelo: "Celta",
      marca: "Chevrolet",
      ano: 2011,
    },
    {
      placa: "LLL2L22",
      chassi: "CHASSI0012",
      renavam: "REN0012",
      modelo: "Fox",
      marca: "VW",
      ano: 2013,
    },
    {
      placa: "MMM3M33",
      chassi: "CHASSI0013",
      renavam: "REN0013",
      modelo: "Etios",
      marca: "Toyota",
      ano: 2018,
    },
    {
      placa: "NNN4N44",
      chassi: "CHASSI0014",
      renavam: "REN0014",
      modelo: "Creta",
      marca: "Hyundai",
      ano: 2022,
    },
    {
      placa: "OOO5O55",
      chassi: "CHASSI0015",
      renavam: "REN0015",
      modelo: "Argo",
      marca: "Fiat",
      ano: 2020,
    },
    {
      placa: "PPP6P66",
      chassi: "CHASSI0016",
      renavam: "REN0016",
      modelo: "Tracker",
      marca: "Chevrolet",
      ano: 2021,
    },
    {
      placa: "QQQ7Q77",
      chassi: "CHASSI0017",
      renavam: "REN0017",
      modelo: "Compass",
      marca: "Jeep",
      ano: 2019,
    },
    {
      placa: "RRR8R88",
      chassi: "CHASSI0018",
      renavam: "REN0018",
      modelo: "T-Cross",
      marca: "VW",
      ano: 2022,
    },
    {
      placa: "SSS9S99",
      chassi: "CHASSI0019",
      renavam: "REN0019",
      modelo: "HR-V",
      marca: "Honda",
      ano: 2021,
    },
    {
      placa: "TTT0T00",
      chassi: "CHASSI0020",
      renavam: "REN0020",
      modelo: "Yaris",
      marca: "Toyota",
      ano: 2023,
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
