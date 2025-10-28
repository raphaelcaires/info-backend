import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { ListVehiclesDto } from "./dto/list-vehicles.dto";

@ApiTags("vehicles")
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly svc: VehiclesService) {}

  @Post()
  @ApiBody({
    description: "Payload para criar um veículo",
    schema: {
      example: {
        placa: "AAA1A11",
        chassi: "CHASSI0001",
        renavam: "REN0001",
        modelo: "Gol",
        marca: "VW",
        ano: 2010,
      },
    },
  })
  @ApiCreatedResponse({
    description: "Veículo criado com sucesso",
    schema: {
      example: {
        id: 1,
        placa: "AAA1A11",
        chassi: "CHASSI0001",
        renavam: "REN0001",
        modelo: "Gol",
        marca: "VW",
        ano: 2010,
        createdAt: "2025-10-28T00:00:00.000Z",
        updatedAt: "2025-10-28T00:00:00.000Z",
      },
    },
  })
  @ApiConflictResponse({
    description: "Conflito - placa, chassi ou renavam já cadastrados",
  })
  create(@Body() dto: CreateVehicleDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "marca", required: false })
  @ApiQuery({ name: "modelo", required: false })
  @ApiQuery({ name: "placa", required: false })
  @ApiQuery({ name: "ano", required: false })
  @ApiOkResponse({
    description: "Paginated list of vehicles",
    schema: {
      example: {
        items: [
          {
            id: 1,
            placa: "AAA1A11",
            chassi: "CHASSI0001",
            renavam: "REN0001",
            modelo: "Gol",
            marca: "VW",
            ano: 2010,
            createdAt: "2025-10-28T00:00:00.000Z",
            updatedAt: "2025-10-28T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  async findAll(
    @Query() query?: ListVehiclesDto,
    @Req() req?: Request,
    @Res({ passthrough: true }) res?: Response
  ) {
    const result = await this.svc.findAll(query);

    if (res) {
      res.setHeader("X-Total-Count", String(result.total));
      res.setHeader("X-Page", String(result.page));
      res.setHeader("X-Limit", String(result.limit));

      if (req) {
        const basePath = req.path || "/api/vehicles";
        const makeUrl = (p: number) => {
          const params = new URLSearchParams();
          if (query && (query as any).marca)
            params.set("marca", (query as any).marca);
          if (query && (query as any).modelo)
            params.set("modelo", (query as any).modelo);
          if (query && (query as any).placa)
            params.set("placa", (query as any).placa);
          if (query && (query as any).ano)
            params.set("ano", String((query as any).ano));
          params.set("page", String(p));
          params.set("limit", String(result.limit));
          return `${basePath}?${params.toString()}`;
        };

        const last = Math.max(1, Math.ceil(result.total / result.limit));
        const links: string[] = [];
        links.push(`<${makeUrl(1)}>; rel="first"`);
        if (result.page > 1)
          links.push(`<${makeUrl(result.page - 1)}>; rel="prev"`);
        if (result.page < last)
          links.push(`<${makeUrl(result.page + 1)}>; rel="next"`);
        links.push(`<${makeUrl(last)}>; rel="last"`);
        res.setHeader("Link", links.join(", "));
      }
    }

    return result;
  }

  @Get(":id")
  @ApiOkResponse({
    description: "Detalhes de um veículo",
    schema: {
      example: {
        id: 1,
        placa: "AAA1A11",
        chassi: "CHASSI0001",
        renavam: "REN0001",
        modelo: "Gol",
        marca: "VW",
        ano: 2010,
        createdAt: "2025-10-28T00:00:00.000Z",
        updatedAt: "2025-10-28T00:00:00.000Z",
      },
    },
  })
  @ApiNotFoundResponse({ description: "Veículo não encontrado" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Put(":id")
  @ApiBody({
    description: "Campos atualizáveis do veículo",
    schema: {
      example: {
        modelo: "Fox",
        marca: "VW",
        ano: 2012,
      },
    },
  })
  @ApiOkResponse({
    description: "Veículo atualizado com sucesso",
    schema: {
      example: {
        id: 1,
        placa: "AAA1A11",
        chassi: "CHASSI0001",
        renavam: "REN0001",
        modelo: "Fox",
        marca: "VW",
        ano: 2012,
        createdAt: "2025-10-28T00:00:00.000Z",
        updatedAt: "2025-10-28T01:00:00.000Z",
      },
    },
  })
  @ApiNotFoundResponse({ description: "Veículo não encontrado" })
  @ApiConflictResponse({ description: "Conflito - valores únicos duplicados" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  @ApiNoContentResponse({
    description: "Veículo removido com sucesso (204 No Content — sem corpo).",
    schema: {
      type: "string",
      example:
        "204 No Content - Sem corpo. O recurso foi removido com sucesso; a resposta não contém corpo.",
    },
  })
  @ApiNotFoundResponse({ description: "Veículo não encontrado" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
