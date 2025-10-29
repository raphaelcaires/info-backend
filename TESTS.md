# Testes Unitários - API de Veículos

Este documento descreve todos os testes unitários implementados para garantir o correto funcionamento da API de veículos.

## 📊 Resumo da Cobertura

- **Total de Testes**: 44
- **Suítes de Teste**: 3
- **Status**: ✅ Todos os testes passando

## 🧪 Suítes de Teste

### 1. VehiclesController (13 testes)

Testa a camada de controle HTTP, incluindo validação de endpoints, headers de paginação e tratamento de erros.

#### Create (2 testes)

- ✅ `should call service.create and return created vehicle` - Valida criação bem-sucedida
- ✅ `should propagate ConflictException on duplicate` - Valida erro de duplicação

#### FindAll (5 testes)

- ✅ `should return paginated results without query params` - Lista com valores padrão
- ✅ `should accept page and limit query params` - Valida paginação customizada
- ✅ `should accept filter params (marca, modelo, placa, ano)` - Valida filtros
- ✅ `should set pagination headers when res is provided` - Headers X-Total-Count, X-Page, X-Limit
- ✅ `should set Link header with pagination links` - Header Link com rel first/prev/next/last

#### FindOne (2 testes)

- ✅ `should return single vehicle by id` - Busca por ID bem-sucedida
- ✅ `should propagate NotFoundException when vehicle not found` - Erro 404

#### Update (2 testes)

- ✅ `should call service.update and return updated vehicle` - Atualização bem-sucedida
- ✅ `should propagate NotFoundException when updating non-existent vehicle` - Erro 404

#### Remove (2 testes)

- ✅ `should call service.remove and return deleted vehicle` - Deleção bem-sucedida
- ✅ `should propagate NotFoundException when deleting non-existent vehicle` - Erro 404

---

### 2. VehiclesService (17 testes)

Testa a camada de negócios, incluindo lógica de filtragem, paginação e integração com Prisma.

#### Create (3 testes)

- ✅ `should create a vehicle and publish event` - Criação + evento RabbitMQ
- ✅ `should throw ConflictException on P2002 error (duplicate placa)` - Placa duplicada
- ✅ `should throw ConflictException on P2002 error (duplicate chassi)` - Chassi duplicado

#### FindAll (7 testes)

- ✅ `should return paginated results with defaults` - Paginação padrão (page=1, limit=10)
- ✅ `should handle page and limit params` - Paginação customizada
- ✅ `should filter by marca` - Filtro case-insensitive por marca
- ✅ `should filter by modelo` - Filtro case-insensitive por modelo
- ✅ `should filter by placa` - Filtro case-insensitive por placa
- ✅ `should filter by ano` - Filtro exato por ano
- ✅ `should combine multiple filters` - Múltiplos filtros simultâneos

#### FindOne (2 testes)

- ✅ `should return vehicle by id` - Busca por ID
- ✅ `should throw NotFoundException when vehicle not found` - Erro 404

#### Update (3 testes)

- ✅ `should update vehicle and return updated data` - Atualização bem-sucedida
- ✅ `should throw NotFoundException when updating non-existent vehicle` - Erro 404
- ✅ `should throw ConflictException on P2002 error during update` - Conflito de unique constraint

#### Remove (2 testes)

- ✅ `should delete vehicle and return deleted data` - Deleção bem-sucedida
- ✅ `should throw NotFoundException when deleting non-existent vehicle` - Erro 404

---

### 3. DTO Validation (14 testes)

Testa a validação de dados de entrada usando class-validator.

#### CreateVehicleDto (4 testes)

- ✅ `should validate valid vehicle data` - DTO válido
- ✅ `should fail when placa is missing` - Campo obrigatório ausente
- ✅ `should fail when ano is not a number` - Tipo incorreto
- ✅ `should fail when placa is not a string` - Tipo incorreto

#### UpdateVehicleDto (3 testes)

- ✅ `should validate partial update data` - DTO parcial válido
- ✅ `should validate when all fields are provided` - DTO completo válido
- ✅ `should fail when ano is invalid` - Tipo incorreto

#### ListVehiclesDto (7 testes)

- ✅ `should validate valid query params with type conversion` - Query params válidos
- ✅ `should use default values when params are missing` - Valores padrão
- ✅ `should fail when page is negative` - Validação @Min(1)
- ✅ `should fail when page is zero` - Validação @Min(1)
- ✅ `should fail when limit exceeds maximum` - Validação @Max(100)
- ✅ `should fail when limit is zero` - Validação @Min(1)
- ✅ `should accept optional filter params` - Filtros opcionais válidos

---

## 🎯 Cenários Testados

### Casos de Sucesso

- Criação, leitura, atualização e deleção de veículos
- Paginação com valores padrão e customizados
- Filtros por marca, modelo, placa e ano
- Combinação de múltiplos filtros
- Headers de paginação (X-Total-Count, X-Page, X-Limit, Link)
- Validação de DTOs com dados válidos

### Casos de Erro

- Criação de veículo com placa/chassi/renavam duplicados (409 Conflict)
- Busca de veículo inexistente (404 Not Found)
- Atualização de veículo inexistente (404 Not Found)
- Deleção de veículo inexistente (404 Not Found)
- Validação de campos obrigatórios ausentes (400 Bad Request)
- Validação de tipos incorretos (400 Bad Request)
- Validação de limites de paginação (page < 1, limit > 100)

### Integrações

- Mock do Prisma para operações de banco de dados
- Mock do RabbitMQ para publicação de eventos
- Mock de Request/Response do Express para headers HTTP

---

## 🚀 Como Executar

```bash
# Executar todos os testes
npm test

# Executar com saída detalhada
npm test -- --verbose

# Executar com cobertura
npm test -- --coverage

# Executar testes em modo watch
npm test -- --watch
```

---

## 📦 Dependências de Teste

- **Jest**: Framework de testes
- **@nestjs/testing**: Utilitários de teste do NestJS
- **class-validator**: Validação de DTOs
- **class-transformer**: Transformação de objetos
- **reflect-metadata**: Metadados para decorators

---

## ✅ Qualidade do Código

Todos os testes foram implementados seguindo as melhores práticas:

- **Arrange-Act-Assert**: Estrutura clara em cada teste
- **Mocks isolados**: Cada teste usa mocks limpos (clearAllMocks)
- **Testes atômicos**: Cada teste valida um único comportamento
- **Nomes descritivos**: Descrição clara do que está sendo testado
- **Cobertura completa**: Todos os endpoints e casos de uso cobertos
