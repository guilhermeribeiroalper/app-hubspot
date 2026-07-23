# Phone Normalizer — Custom Workflow Action

Esta pasta contém o handler para uma **Custom Workflow Action** da HubSpot
que normaliza números de telefone, removendo caracteres especiais e o
código de país (DDI).

## O que esta action faz

Recebe um telefone em formato internacional, ex.: `+55-99999-0000`,
e devolve apenas os dígitos do número local, sem DDI, sem `+`, sem `-`.

| Entrada                  | Saída (`phone_clean`) | `country_code` |
| ------------------------ | --------------------- | -------------- |
| `+55-99999-0000`         | `999990000`           | `55`           |
| `+1-415-555-0123`        | `4155550123`          | `1`            |
| `+44-20 7946 0958`       | `2079460958`          | `44`           |
| `1199990000` (sem `+`)   | `1199990000`          | `""`           |
| `+5511999990000` (sem `-`)| `5511999990000`      | `""`           |
| `""` ou `null`           | `""`                  | `""`           |

Regras:
1. Se a string **começa com `+`** e tem um **`-`** em seguida, o que
   estiver entre o `+` e o primeiro `-` é considerado o DDI e removido.
2. Todos os caracteres não numéricos (espaços, parênteses, pontos, traços)
   são removidos.
3. Se **não houver `+`** ou **não houver `-` depois do `+`**, a string
   original é devolvida sem caracteres não numéricos (sem o `+`), sem
   detecção de DDI. Esse é o comportamento pedido quando "não tem
   dígito suficiente ou não tem o símbolo de +".

## Arquivos

- `phone-normalizer.js` — handler Fastify + função pura `normalizePhone()`.
- `run-tests.js` — bateria de testes da função pura.
- `register-route.snippet.js` — snippet para colar no `app.js`/`server.js`
  do backend do Render registrando a nova rota.

## Como fazer o deploy

### 1. Backend (Render)

1. Copie `phone-normalizer.js` para o seu repositório do backend
   (`app-hubspot.onrender.com`), em `src/routes/` ou onde ficam as
   outras rotas de workflow.
2. No arquivo onde as outras rotas são registradas, importe o handler e
   registre a rota POST. Exemplo (Fastify):

   ```js
   const { phoneNormalizerHandler } = require("./routes/phone-normalizer");

   // ... dentro do setup do fastify
   fastify.post("/workflow-action/phone-normalizer", phoneNormalizerHandler);
   ```

   Veja `register-route.snippet.js` para o snippet completo.
3. Rode os testes localmente: `node run-tests.js` (de dentro desta pasta).
4. Faça commit + push → Render faz deploy automático.

### 2. HubSpot (Custom Workflow Action)

1. Faça upload do projeto HubSpot: `hs project upload`
2. Faça deploy: `hs project deploy`
3. No portal HubSpot, abra qualquer workflow.
4. Adicione a ação **"Normalize Phone Number"** (que aparece na seção
   "Alper API Engine").
5. Mapeie o input `raw_phone` para a propriedade que contém o telefone
   bruto do contato (ex.: `{{contact.phone}}`).
6. **Em seguida**, adicione uma ação **"Edit record"** e mapeie:
   - **Property to set:** `phone`
   - **Value to set:** o output `phone_clean` da action anterior
     (use o seletor de outputs do workflow).
7. Salve e ative o workflow.

> O mapeamento de `phone_clean` → propriedade `phone` do contato é
> feito pela ação "Edit record" subsequente, não pela própria
> custom action. Isso é por design — custom actions só transformam
> dados, não persistem em propriedades.

## Testes

```bash
node backend-examples/run-tests.js
```

Esperado: `PASS: 8  FAIL: 0`.

## Notas técnicas

- O `logger.ts` que já existe em `Alper HS APIs/backend/src/lib/`
  não é usado aqui — o handler é puro e devolve um JSON direto.
  Se quiser logar, é só chamar `request.log.info(...)` antes do
  `reply.send`.
- O shape `{ outputFields: { ... } }` é o que a HubSpot espera
  num callback de Custom Workflow Action. Os nomes das chaves
  dentro de `outputFields` devem bater com os `outputFields`
  declarados no `phone-normalizer-action-hsmeta.json`.
