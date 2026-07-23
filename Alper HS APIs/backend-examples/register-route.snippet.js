// ============================================================================
// register-route.snippet.js
//
// Snippet de referência para registrar a nova rota de Phone Normalizer
// no backend do Render (app-hubspot.onrender.com).
//
// ONDE COLAR:
//   Cole este trecho dentro do arquivo onde as outras rotas de
//   workflow já são registradas. O nome do arquivo varia conforme a
//   estrutura do seu backend (ex.: src/app.js, src/server.js,
//   src/routes/workflow-action.js, src/routes/index.js). Se não
//   souber, procure por "fastify.post" ou "app.post" no seu projeto
//   — vai achar a linha que registra a rota do api_request_action.
//
// AJUSTE O CAMINHO DO require ABAIXO CONFORME A SUA ESTRUTURA:
//   - "./phone-normalizer"  → se você copiou o arquivo na mesma pasta
//   - "./routes/phone-normalizer" → se copiou em src/routes/
//   - "../routes/phone-normalizer" → se o registro é em src/app.js
// ============================================================================

// 1) Import no topo do arquivo (junto dos outros requires):
const { phoneNormalizerHandler } = require("./routes/phone-normalizer");
//  ↑ troque "./routes/phone-normalizer" pelo caminho real do arquivo
//    no seu projeto

// 2) Registro da rota, junto das outras rotas /workflow-action/...
//    Exemplo Fastify (o que parece ser o seu caso, dado o logger.ts):
fastify.post(
  "/workflow-action/phone-normalizer",
  phoneNormalizerHandler
);

//    Se o seu backend usa Express em vez de Fastify, a forma equivalente
//    é (não precisa instalar nada novo — `reply.send` foi usado no
//    handler, mas o handler pode ser portado facilmente):
//
//    app.post("/workflow-action/phone-normalizer", (req, res) => {
//      // Mesma lógica do phoneNormalizerHandler, trocando reply.send
//      // por res.json(...) — abra phone-normalizer.js, copie o corpo
//      // do handler e ajuste.
//    });
//
//    Como o logger.ts que já está no projeto é de Fastify
//    (`import type { FastifyInstance }`), o mais provável é que o
//    backend seja Fastify mesmo. Use o exemplo do fastify.post
//    acima.
