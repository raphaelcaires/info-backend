import { IsInt, IsNotEmpty, IsString, Length } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  placa: string;

  @IsString()
  @IsNotEmpty()
  chassi: string;

  @IsString()
  @IsNotEmpty()
  renavam: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsInt()
  ano: number;
}
