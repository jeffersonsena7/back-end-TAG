const express = require('express');
const router = express.Router();
const { lerPlanilha, salvarPlanilha } = require('../services/planilhaServices');

const upload = require('../config/multer-config');
const cloudinary = require('../config/cloudinary');

router.get('/', (req, res) => {
  try {
    const dados = lerPlanilha();
    res.json(dados);
  } catch (error) {
    console.error('Erro ao ler a planilha:', error);
    res.status(500).json({ message: 'Erro ao processar a planilha' });
  }
});

router.post('/salvar', upload.single('foto'), async (req, res) => {
  try {
    const editData = req.body;

    // Se houver um arquivo, faça o upload para o Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      editData.fotoUrl = result.secure_url;
    }

    const { headers, rows } = lerPlanilha();
    const indiceTag = headers.findIndex(h => ['tag', 'TAG', 'Tag'].includes(h));
    if (indiceTag === -1) throw new Error('Coluna Tag não encontrada');

    const tagEditada = editData[headers[indiceTag]];
    const rowIndex = rows.findIndex(row => row[indiceTag] === tagEditada);
    if (rowIndex === -1) throw new Error('Tag não encontrada na planilha');

    const novaLinha = headers.map(h => editData[h] ?? '');
    rows[rowIndex] = novaLinha;

    salvarPlanilha(headers, rows);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar a planilha:', error);
    res.status(500).json({ message: 'Erro ao salvar a planilha' });
  }
});

module.exports = router;