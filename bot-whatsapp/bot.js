import makeWASocket, { 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys";

import express from "express";
import qrcode from "qrcode-terminal";

const GRUPO_ID = "120363405830918592@g.us";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    browser: ["Windows", "Chrome", "120.0.0"],
  });

  const app = express();
  app.use(express.json());

  // 🔥 ROTA PRA RECEBER DO TEU SITE
  app.post("/enviar", async (req, res) => {
    try {
      const { mensagem } = req.body;

      await sock.sendMessage(GRUPO_ID, {
        text: mensagem,
      });

      res.send({ status: "ok" });
    } catch (err) {
      console.log(err);
      res.status(500).send({ erro: "erro ao enviar" });
    }
  });

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log("🚀 API rodando");
    });

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("📱 ESCANEIA O QR:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ BOT CONECTADO");
    }

    if (connection === "close") {
      console.log("❌ Caiu... reconectando");
      startBot();
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();