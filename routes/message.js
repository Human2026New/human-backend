import express from 'express';
const router = express.Router();

// Endpoint para app enviar mensagens ao bot
router.post('/send', async (req, res) => {
  const { chatId, text } = req.body;

  if (!chatId || !text) {
    return res.status(400).json({ error: 'chatId e text obrigatórios' });
  }

  // Enviar para bot mais tarde (vamos integrar)
  console.log('Mensagem recebida da app:', text);

  return res.json({ ok: true, message: 'Mensagem recebida, bot vai responder!' });
});

export default router;
