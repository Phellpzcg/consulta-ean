import express from "express";
import { env } from "./config/env";
import { consultarGtin } from "./api/gtinController";
import { logger } from "./utils/logger";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).send(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Consulta GTIN</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      }
      body {
        margin: 0;
        padding: 32px;
        background: #f6f7fb;
        color: #1f2937;
      }
      main {
        max-width: 720px;
        margin: 0 auto;
        background: #ffffff;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin-top: 0;
        font-size: 1.75rem;
      }
      form {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 24px 0;
      }
      input {
        flex: 1 1 240px;
        padding: 12px 14px;
        border: 1px solid #cbd5f5;
        border-radius: 8px;
        font-size: 1rem;
      }
      button {
        padding: 12px 18px;
        border: none;
        border-radius: 8px;
        background: #1d4ed8;
        color: #fff;
        font-size: 1rem;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .status {
        margin-top: 12px;
        font-weight: 600;
      }
      .card {
        margin-top: 16px;
        padding: 16px;
        border-radius: 10px;
        background: #f1f5ff;
        border: 1px solid #c7d2fe;
      }
      dl {
        margin: 0;
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 6px 12px;
      }
      dt {
        font-weight: 600;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Consulta de GTIN</h1>
      <p>Digite o GTIN para consultar as informações no web service.</p>
      <form id="gtin-form">
        <input id="gtin-input" name="gtin" placeholder="Ex: 7891234567895" required />
        <button id="gtin-button" type="submit">Consultar</button>
      </form>
      <div id="status" class="status"></div>
      <div id="result" class="card" hidden></div>
    </main>
    <script>
      const form = document.getElementById("gtin-form");
      const input = document.getElementById("gtin-input");
      const button = document.getElementById("gtin-button");
      const status = document.getElementById("status");
      const result = document.getElementById("result");

      const setLoading = (isLoading) => {
        button.disabled = isLoading;
        button.textContent = isLoading ? "Consultando..." : "Consultar";
      };

      const renderResult = (data) => {
        result.hidden = false;
        if (!data || data.status !== "sucesso" || !data.produto) {
          result.innerHTML = "<pre></pre>";
          result.querySelector("pre").textContent = JSON.stringify(data, null, 2);
          return;
        }

        const cest = Array.isArray(data.produto.cest) ? data.produto.cest.join(", ") : "";
        result.innerHTML = \`
          <dl>
            <dt>GTIN</dt><dd></dd>
            <dt>Descrição</dt><dd></dd>
            <dt>NCM</dt><dd></dd>
            <dt>Tipo</dt><dd></dd>
            <dt>CEST</dt><dd></dd>
          </dl>
        \`;
        const values = [
          data.produto.gtin || "",
          data.produto.descricao || "",
          data.produto.ncm || "",
          data.produto.tpGTIN || "",
          cest,
        ];
        result.querySelectorAll("dd").forEach((node, index) => {
          node.textContent = values[index] ?? "";
        });
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        status.textContent = "";
        result.hidden = true;

        const gtin = input.value.trim();
        if (!gtin) {
          status.textContent = "Informe um GTIN válido.";
          return;
        }

        setLoading(true);
        try {
          const response = await fetch("/api/gtin/consultar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gtin }),
          });
          const data = await response.json();
          status.textContent = data.mensagem || "Resposta recebida.";
          renderResult(data);
        } catch (error) {
          status.textContent = "Não foi possível consultar o GTIN.";
        } finally {
          setLoading(false);
        }
      });
    </script>
  </body>
</html>`);
});

app.post("/api/gtin/consultar", consultarGtin);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(env.port, () => {
  logger.info(`Servidor GTIN iniciado na porta ${env.port}`);
});
