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
      editData.fotoURL = result.secure_url;
      editData.publicId = result.public_id;
    }

    const { headers, rows } = lerPlanilha();
    const indiceTag = headers.findIndex(h => ['tag', 'TAG', 'Tag'].includes(h));
    if (indiceTag === -1) throw new Error('Coluna Tag não encontrada');

    const tagEditada = editData[headers[indiceTag]];
    const rowIndex = rows.findIndex(row => row[indiceTag] === tagEditada);
    if (rowIndex === -1) throw new Error('Tag não encontrada na planilha');

    let indicePublicId = headers.findIndex(h => h.toLowerCase() === 'publicid');
    if (indicePublicId === -1) {
      headers.push('publicId');
      rows.forEach(row => row.push(''));
      indicePublicId = headers.length - 1;
    }

    const novaLinha = headers.map(h => editData[h] ?? '');
    rows[rowIndex] = novaLinha;

    salvarPlanilha(headers, rows);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar a planilha:', error);
    res.status(500).json({ message: 'Erro ao salvar a planilha' });
  }
});

// Rota DELETE para apagar foto do Cloudinary e remover URL da planilha
router.delete('/foto/:tag', async (req, res) => {
  try {
    const tag = req.params.tag;
    if (!tag) return res.status(400).json({ message: 'Tag é obrigatória' });

    const { headers, rows } = lerPlanilha();

    const indiceTag = headers.findIndex(h => ['tag', 'TAG', 'Tag'].includes(h));
    if (indiceTag === -1) throw new Error('Coluna Tag não encontrada');

    const rowIndex = rows.findIndex(row => row[indiceTag] === tag);
    if (rowIndex === -1) throw new Error('Tag não encontrada na planilha');

    const indiceFoto = headers.findIndex(h => ['fotoUrl', 'fotoURL', 'fotourl'].includes(h));
    if (indiceFoto === -1) {
      return res.status(400).json({ message: 'Coluna fotoURL não encontrada na planilha' });
    }

    const indicePublicId = headers.findIndex(h => h.toLowerCase() === 'publicid');
    const publicId = indicePublicId !== -1 ? rows[rowIndex][indicePublicId] : null;

    console.log('PublicId extraído da planilha:', publicId);

    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }

    rows[rowIndex][indiceFoto] = '';
    if (indicePublicId !== -1) {
      rows[rowIndex][indicePublicId] = '';
    }

    salvarPlanilha(headers, rows);

    return res.json({ success: true, message: 'Foto deletada e planilha atualizada' });
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return res.status(500).json({ message: 'Erro ao deletar foto' });
  }
});

module.exports = router;
