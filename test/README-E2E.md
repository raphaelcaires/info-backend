# Testes E2E - API de Veículos

Testes de integração end-to-end que validam o funcionamento completo da API com banco de dados PostgreSQL e RabbitMQ.

## 🎯 Objetivo

Os testes e2e garantem que:

- ✅ A API está integrada corretamente com o PostgreSQL
- ✅ As operações CRUD funcionam com dados reais
- ✅ Os eventos são publicados corretamente no RabbitMQ
- ✅ As constraints do banco são respeitadas (unique, foreign keys)
- ✅ Os índices estão funcionando para otimizar queries
- ✅ A validação de dados funciona end-to-end

## 📋 Pré-requisitos

Antes de executar os testes e2e, certifique-se de que:

1. **PostgreSQL está rodando:**

   ```bash
   docker compose up -d postgres
   ```

2. **RabbitMQ está rodando:**

   ```bash
   docker compose up -d rabbitmq
   ```

3. **API está rodando localmente:**

   ```bash
   npm start
   ```

4. **Variáveis de ambiente configuradas:**
   - Copie `.env.example` para `.env`
   - Configure `DATABASE_URL` e `RABBITMQ_URL`

## 🚀 Como Executar

### Método 1: Script Automatizado (Recomendado)

```bash
./test/run-e2e.sh
```

O script verifica automaticamente se os serviços estão rodando.

### Método 2: Comando NPM

```bash
npm run test:e2e
```

### Método 3: Com Watch Mode

```bash
npm run test:e2e:watch
```

## 📊 Cobertura de Testes

### Total: 29 testes e2e

#### POST /vehicles (4 testes)

- ✅ Criar veículo e publicar evento no RabbitMQ
- ✅ Retornar 409 ao tentar criar placa duplicada
- ✅ Retornar 400 quando campos obrigatórios estão ausentes
- ✅ Retornar 400 quando tipo de dado é inválido

#### GET /vehicles (10 testes)

- ✅ Retornar veículos paginados com valores padrão (page=1, limit=10)
- ✅ Retornar veículos com page e limit customizados
- ✅ Filtrar veículos por marca
- ✅ Filtrar veículos por modelo
- ✅ Filtrar veículos por ano
- ✅ Filtrar veículos por placa (busca parcial)
- ✅ Combinar múltiplos filtros simultaneamente
- ✅ Retornar header Link com paginação (first, prev, next, last)
- ✅ Retornar 400 para page inválido (negativo)
- ✅ Retornar 400 para limit inválido (> 100)

#### GET /vehicles/:id (2 testes)

- ✅ Retornar veículo por ID
- ✅ Retornar 404 quando veículo não existe

#### PUT /vehicles/:id (3 testes)

- ✅ Atualizar veículo com sucesso
- ✅ Retornar 404 ao atualizar veículo inexistente
- ✅ Retornar 409 ao atualizar para placa duplicada

#### DELETE /vehicles/:id (2 testes)

- ✅ Deletar veículo com sucesso
- ✅ Retornar 404 ao deletar veículo inexistente

#### Database Integration (3 testes)

- ✅ Respeitar unique constraint em placa
- ✅ Respeitar unique constraint em chassi
- ✅ Usar índices para otimizar queries de filtro

#### RabbitMQ Integration (1 teste)

- ✅ Publicar múltiplos eventos de criação de veículos

## 🧪 Detalhes dos Testes

### Integração com PostgreSQL

Os testes validam:

- **Transações**: Operações CRUD são persistidas corretamente
- **Constraints**: Unique constraints em placa, chassi e renavam
- **Índices**: Queries de filtro usam índices em marca, modelo e ano
- **Cascade**: Operações de delete não quebram integridade referencial

### Integração com RabbitMQ

Os testes validam:

- **Publicação**: Eventos são publicados na fila `vehicle_created`
- **Payload**: Mensagens contêm `{ action: "created", vehicle: {...} }`
- **Confiabilidade**: Eventos são publicados mesmo com múltiplas criações
- **Graceful degradation**: API funciona mesmo se RabbitMQ estiver offline

### Validação End-to-End

Os testes validam:

- **DTOs**: ValidationPipe transforma e valida dados de entrada
- **Headers HTTP**: X-Total-Count, X-Page, X-Limit, Link
- **Status codes**: 200, 201, 400, 404, 409 conforme esperado
- **Response bodies**: JSON com estrutura correta

## 📝 Estrutura dos Arquivos

```
test/
├── jest-e2e.json           # Configuração Jest para e2e
├── vehicles.e2e-spec.ts    # Testes e2e completos
├── run-e2e.sh              # Script auxiliar para executar testes
└── README-E2E.md           # Esta documentação
```

## 🔧 Configuração

### jest-e2e.json

```json
{
  "testTimeout": 30000, // Timeout de 30s para operações de I/O
  "testRegex": ".e2e-spec.ts$",
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  }
}
```

### Limpeza de Dados

Cada teste executa em um banco limpo:

- `beforeEach`: Deleta todos os veículos (`DELETE FROM vehicles`)
- Garante isolamento entre testes
- Previne interferência de dados residuais

## 🐛 Troubleshooting

### Erro: "API is not running"

**Solução:**

```bash
npm start
```

### Erro: "connect ECONNREFUSED 127.0.0.1:5432"

**Solução:**

```bash
docker compose up -d postgres
```

### Erro: "RabbitMQ not available"

**Solução:**

```bash
docker compose up -d rabbitmq
```

Os testes continuarão executando, mas pularão validações de RabbitMQ.

### Erro: "Database has pending migrations"

**Solução:**

```bash
npx prisma migrate dev
```

### Erro: "EADDRINUSE: address already in use :::3000"

**Solução:**

```bash
# Encontre o processo usando a porta 3000
lsof -ti:3000

# Mate o processo
kill -9 $(lsof -ti:3000)

# Reinicie a API
npm start
```

## 📈 Cobertura vs Testes Unitários

| Aspecto            | Testes Unitários       | Testes E2E              |
| ------------------ | ---------------------- | ----------------------- |
| **Velocidade**     | ⚡ Rápidos (<2s)       | 🐌 Lentos (30s)         |
| **Isolamento**     | ✅ Totalmente isolados | ❌ Dependem de serviços |
| **Confiabilidade** | 🔍 Lógica individual   | 🌐 Sistema completo     |
| **Mocks**          | ✅ Usa mocks           | ❌ Sem mocks            |
| **Banco Real**     | ❌ Mock Prisma         | ✅ PostgreSQL real      |
| **RabbitMQ Real**  | ❌ Mock                | ✅ RabbitMQ real        |

## 🎯 Quando Executar

- **Desenvolvimento**: Execute testes unitários (`npm test`)
- **Antes de commit**: Execute e2e (`npm run test:e2e`)
- **CI/CD**: Execute ambos em pipeline
- **Produção**: Considere smoke tests e2e

## 🚀 Melhorias Futuras

- [ ] Testes de concorrência (múltiplos requests simultâneos)
- [ ] Testes de performance (response time, throughput)
- [ ] Testes de stress (carga alta)
- [ ] Testes de segurança (SQL injection, XSS)
- [ ] Testes de resiliência (falhas de rede, timeouts)
- [ ] Cobertura de cenários de worker (consumo de mensagens)

## 📚 Recursos

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)

---

✅ **Status**: 29/29 testes e2e passando
