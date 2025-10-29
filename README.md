# Info Backend

Backend API para gerenciamento de veículos desenvolvido com NestJS, Prisma ORM e RabbitMQ.

## 📋 Descrição

Este projeto implementa uma API REST completa para gerenciamento de veículos, incluindo operações CRUD, validação de dados, paginação, documentação OpenAPI/Swagger e processamento assíncrono via mensageria RabbitMQ.

## ✨ Funcionalidades

- **CRUD Completo**: Criar, listar, buscar, atualizar e deletar veículos
- **Validação de Dados**: Validações robustas usando class-validator
- **Paginação**: Suporte a paginação com headers informativos
- **Documentação Interativa**: Swagger/OpenAPI com exemplos
- **Mensageria**: Publicação de eventos via RabbitMQ
- **Worker Assíncrono**: Processamento de mensagens em background
- **Banco de Dados**: PostgreSQL com migrações Prisma
- **Containerização**: Docker e Docker Compose para desenvolvimento e produção
- **Testes**: Testes unitários com Jest
- **TypeScript**: Tipagem forte e configurações flexíveis

## 🛠️ Tecnologias

- **Framework**: NestJS v11
- **ORM**: Prisma v6
- **Banco**: PostgreSQL 15
- **Mensageria**: RabbitMQ 3
- **Linguagem**: TypeScript/Node.js v22
- **Validação**: class-validator
- **Documentação**: @nestjs/swagger
- **Testes**: Jest
- **Container**: Docker & Docker Compose

## 📋 Pré-requisitos

- Node.js v22+
- Docker & Docker Compose
- npm ou yarn

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd info-backend
```

### 2. Instale as dependências

```bash
npm ci
```

### 3. Configure o ambiente

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp .env.example .env
```

Configure as variáveis no arquivo `.env` conforme necessário.

### 4. Configure o banco de dados

```bash
# Gere o cliente Prisma
npm run prisma:generate

# Execute as migrações
npm run prisma:migrate

# (Opcional) Popule o banco com dados de exemplo (20 veículos)
npm run seed
```

## ▶️ Executando a Aplicação

### Desenvolvimento Local

#### Opção 1: Tudo em containers (Recomendado)

```bash
# Inicia todos os serviços (API, Worker, Postgres, RabbitMQ)
npm run compose:up

# Ou em background
npm run compose:up:detached

# Para parar
npm run compose:down
```

#### Opção 2: API local com dependências em containers

```bash
# Inicie apenas as dependências
docker compose up postgres rabbitmq -d

# Execute a API localmente
npm run start:dev

# Ou build e start
npm start
```

### Produção

```bash
# Build da aplicação
npm run build

# Execute com Docker Compose
docker compose -f docker-compose.prod.yml up --build
```

## 📚 API Documentation

### Endpoints Principais

#### Veículos

- `GET /api/vehicles` - Lista veículos com paginação
- `POST /api/vehicles` - Cria novo veículo
- `GET /api/vehicles/:id` - Busca veículo por ID
- `PUT /api/vehicles/:id` - Atualiza veículo
- `DELETE /api/vehicles/:id` - Remove veículo

### Documentação Interativa

Acesse a documentação Swagger em: <http://localhost:3000/api/docs>

### Headers de Paginação

- `X-Total-Count`: Total de registros
- `X-Page`: Página atual
- `X-Limit`: Limite por página
- `Link`: Links para navegação (prev/next/first/last)

### Exemplo de Request

```bash
# Criar veículo
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "ABC1234",
    "chassi": "9BWZZZ377VT004251",
    "renavam": "123456789",
    "modelo": "Gol",
    "marca": "Volkswagen",
    "ano": 2020
  }'
```

## 🧪 Testes

### Testes Unitários

```bash
# Executar todos os testes unitários
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:cov
```

**Cobertura**: 44 testes unitários cobrindo controller, service e DTOs.

📄 Veja [TESTS.md](./TESTS.md) para detalhes completos.

### Testes E2E (End-to-End)

```bash
# Executar testes e2e
npm run test:e2e

# Testes e2e em modo watch
npm run test:e2e:watch

# Usar script auxiliar (verifica serviços)
./test/run-e2e.sh
```

**Pré-requisitos para E2E:**

- PostgreSQL rodando: `docker compose up -d postgres`
- RabbitMQ rodando: `docker compose up -d rabbitmq`
- API rodando: `npm start`

**Cobertura**: 25 testes e2e validando integração com banco e RabbitMQ.

📄 Veja [test/README-E2E.md](./test/README-E2E.md) para detalhes completos.

### Resumo de Testes

| Tipo          | Quantidade | Cobertura                 |
| ------------- | ---------- | ------------------------- |
| **Unitários** | 44         | Controller, Service, DTOs |
| **E2E**       | 25         | PostgreSQL, RabbitMQ, API |
| **Total**     | **69**     | Sistema completo          |

## 🗄️ Banco de Dados

### Modelo de Dados

```prisma
model Vehicle {
  id        String   @id @default(cuid())
  placa     String   @unique
  chassi    String   @unique
  renavam   String   @unique
  modelo    String
  marca     String
  ano       Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updateAt

  @@index([modelo, marca])
  @@index([ano])
}
```

### Operações do Prisma

```bash
# Gerar cliente
npm run prisma:generate

# Criar migração
npm run prisma:migrate

# Reset do banco (desenvolvimento)
npm run prisma:reset

# Studio (interface gráfica)
npm run prisma:studio
```

## 🐰 RabbitMQ

### Configuração

- **Management UI**: <http://localhost:15672>
- **Credenciais**: guest/guest
- **Fila**: `vehicle_created`

### Worker

O worker consome mensagens da fila `vehicle_created` e processa eventos de criação de veículos em background.

## 📁 Estrutura do Projeto

```text
src/
├── main.ts                 # Ponto de entrada da aplicação
├── app.module.ts           # Módulo principal
├── prisma/
│   ├── prisma.service.ts   # Serviço Prisma
│   └── prisma.module.ts    # Módulo Prisma
├── vehicles/
│   ├── vehicles.controller.ts  # Controller REST
│   ├── vehicles.service.ts     # Lógica de negócio
│   ├── vehicles.module.ts      # Módulo de veículos
│   ├── dto/                    # Data Transfer Objects
│   └── vehicles.spec.ts        # Testes
├── worker/
│   └── worker.ts           # Worker RabbitMQ
└── config/                 # Configurações
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Hot reload
npm start                  # Build + start
npm run build              # Compilar TypeScript

# Docker
npm run compose:up         # Iniciar containers
npm run compose:up:detached # Containers em background
npm run compose:down       # Parar containers

# Banco de dados
npm run prisma:generate    # Gerar cliente Prisma
npm run prisma:migrate     # Executar migrações
npm run seed               # Popular banco

# Testes
npm test                   # Executar testes
npm run test:watch         # Testes em watch mode
```

## 🌍 Variáveis de Ambiente

| Variável       | Descrição                         | Padrão      |
| -------------- | --------------------------------- | ----------- |
| `DATABASE_URL` | URL de conexão PostgreSQL         | -           |
| `RABBITMQ_URL` | URL de conexão RabbitMQ           | -           |
| `NODE_ENV`     | Ambiente (development/production) | development |

## 🐳 Docker

### Imagens

- **API**: `node:22-alpine` multi-stage build
- **Worker**: `node:22-alpine` multi-stage build
- **Database**: `postgres:15-alpine`
- **Message Broker**: `rabbitmq:3-management`

### Volumes

- `postgres_data`: Dados persistentes do PostgreSQL
- `node_modules`: Cache de dependências Node.js

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
