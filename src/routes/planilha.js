const express = require('express');
const router = express.Router();

const { lerPlanilha } = require('../services/planilhaServices');

router.get('/', (req, res) => {
  try {
    const dados = lerPlanilha();
    res.json(dados);
  } catch (error) {
    console.error('Erro ao ler a planilha:', error);
    res.status(500).json({ message: 'Erro ao processar a planilha' });
  }
});

module.exports = router;
