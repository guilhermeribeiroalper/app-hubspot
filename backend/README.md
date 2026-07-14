# HubSpot Workflow Engine

Backend Fastify para o app HubSpot "Alper API Workflow Engine".

## O que faz

Recebe callbacks de workflows HubSpot, faz requisição HTTP externa configurável e atualiza propriedades de objetos (Contacts, Deals, Companies, etc.) com base na resposta.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Preencha .env com seus tokens
npm run dev
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `HUBSPOT_SERVICE_KEY` | Service Key criada em HubSpot > Desenvolvimento > Chaves > Chaves de serviço |
| `CLIENT_SECRET` | Secret do app (para validação de assinatura X-HubSpot-Signature-v3) |
| `PORT` | Porta do servidor (default: 3000) |
| `LOG_LEVEL` | Nível de log: debug, info, warn, error |

## Como obter as credenciais

### HUBSPOT_SERVICE_KEY

1. No HubSpot, vá em **Desenvolvimento** → **Chaves** → **Chaves de serviço**
2. Clique em **Criar chave de serviço**
3. Nomeie (ex: `workflow-engine-api`)
4. Adicione escopos: `crm.objects.contacts`, `crm.objects.companies`, `crm.objects.deals` (read/write)
5. Clique em **Criar**
6. Copie o token gerado

### CLIENT_SECRET

1. No HubSpot, vá em **Desenvolvimento** → **Aplicativos legados**
2. Clique no app do projeto (ou crie um novo)
3. Aba **Auth** ou **App Info**
4. Copie o **Client Secret**

## Deploy no Render

1. Conecte o repositório ao Render
2. O `render.yaml` configura automaticamente
3. Defina as variáveis de ambiente no painel do Render
4. Deploy automático a cada push

## Estrutura

```
backend/
├── src/
│   ├── server.ts                    # Entry point
│   ├── config/env.ts                # Env validation (Zod)
│   ├── routes/workflow-action.ts    # Rota principal
│   ├── services/
│   │   ├── hubspot-signature.ts     # Validação HMAC
│   │   ├── http-client.ts           # HTTP externo com retry
│   │   ├── hubspot-updater.ts       # Update multi-objeto
│   │   └── field-mapper.ts          # Mapeamento response → props
│   ├── lib/
│   │   ├── idempotency.ts           # Cache de callbackIds
│   │   └── logger.ts                # Structured logging
│   └── types/workflow.ts            # Types
├── Dockerfile
├── render.yaml
└── package.json
```

## Teste

```bash
# Health check
curl http://localhost:3000/health

# Simular payload HubSpot
curl -X POST http://localhost:3000/workflow-action \
  -H "Content-Type: application/json" \
  -H "X-HubSpot-Signature-v3: <signature>" \
  -d '{
    "callbackId": "test-123",
    "origin": {"portalId": 123, "actionDefinitionId": 1, "actionDefinitionVersion": 1},
    "context": {"source": "WORKFLOWS", "workflowId": 1},
    "object": {"objectId": 1, "properties": {"email": "test@test.com"}, "objectType": "CONTACT"},
    "inputFields": {
      "api_url": "https://jsonplaceholder.typicode.com/users/1",
      "http_method": "GET",
      "auth_type": "none",
      "field_mapping": "{\"email\": \"email\", \"name\": \"firstname\"}"
    }
  }'
```
