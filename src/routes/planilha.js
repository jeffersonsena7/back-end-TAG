const express = require('express');
const router = express.Router();
const { lerPlanilha, salvarPlanilha } = require('../services/planilhaServices');

router.get('/', (req, res) => {
  try {
    const dados = lerPlanilha();
    res.json(dados);
  } catch (error) {
    console.error('Erro ao ler a planilha:', error);
    res.status(500).json({ message: 'Erro ao processar a planilha' });
  }
});

router.post('/salvar', express.json(), (req, res) => {
  try {
    const editData = req.body;
    salvarPlanilha(editData);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar a planilha:', error);
    res.status(500).json({ message: 'Erro ao salvar a planilha' });
  }
});

module.exports = router;
