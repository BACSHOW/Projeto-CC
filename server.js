const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require("dotenv").config(); // Carregar variáveis de ambiente

const app = express();
const PORT = process.env.PORT || 3000; // Usar a porta do ambiente de produção

// Middleware
const corsOptions = {
  origin: "https://projeto-cc.vercel.app",  // Alterado para o domínio de produção do Vercel
  methods: "GET,POST",
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve arquivos estáticos (CSS, JS) da pasta onde o server.js está localizado
app.use(express.static(__dirname));

// Rota para a página principal (index.html)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Inicia o servidor na porta 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Headers da Suitpay para PRODUÇÃO
const headers = {
  ci: process.env.CI,  // Usando variável de ambiente
  cs: process.env.CS,  // Usando variável de ambiente
};

// Rota: Consultar taxas
app.get("/api/fees", async (req, res) => {
  try {
    const response = await fetch(
      "https://ws.suitpay.app/api/v1/gateway/fee-simulator-gateway",  // URL de produção
      { method: "GET", headers }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao consultar taxas." });
  }
});

// Rota: Realizar pagamento
app.post("/api/pay", async (req, res) => {
  const paymentData = req.body;

  // Verifique se os dados do pagamento estão completos
  if (!paymentData.requestNumber || !paymentData.client || !paymentData.card) {
    return res.status(400).json({ error: "Dados incompletos para o pagamento." });
  }

  try {
    const response = await fetch(
      "https://ws.suitpay.app/api/v1/gateway/card",  // URL de produção
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    const data = await response.json();

    // Verifique o status da transação
    if (data.response === "ERROR" || data.response === "CARD_ERROR") {
      return res.status(500).json({
        error: data.acquirerMessage || "Erro ao processar pagamento. Verifique os dados.",
      });
    }

    res.json(data); // Retorne os dados da resposta da API de pagamento
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao processar pagamento." });
  }
});
