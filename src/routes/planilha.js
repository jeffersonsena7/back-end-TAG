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

// Rota DELETE para apagar foto do Cloudinary e remover URL da planilha
router.delete('/foto/:tag', async (req, res) => {
  try {
    const tag = req.params.tag;
    if (!tag) return res.status(400).json({ message: 'Tag é obrigatória' });

    // Ler planilha para achar foto da tag
    const { headers, rows } = lerPlanilha();

    const indiceTag = headers.findIndex(h => ['tag', 'TAG', 'Tag'].includes(h));
    if (indiceTag === -1) throw new Error('Coluna Tag não encontrada');

    const rowIndex = rows.findIndex(row => row[indiceTag] === tag);
    if (rowIndex === -1) throw new Error('Tag não encontrada na planilha');

    const indiceFoto = headers.findIndex(h => ['fotoUrl', 'fotoURL', 'fotourl'].includes(h));
    if (indiceFoto === -1) {
      return res.status(400).json({ message: 'Coluna fotoUrl não encontrada na planilha' });
    }

    const urlFoto = rows[rowIndex][indiceFoto];

    if (urlFoto) {
      // Extrai public_id da url para deletar do Cloudinary
      // Exemplo de url: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567/folder/filename.png
      // public_id é 'folder/filename' (sem extensão)
      const urlParts = urlFoto.split('/');
      const lastPart = urlParts[urlParts.length - 1]; // filename.png
      const folderPart = urlParts[urlParts.length - 2]; // folder
      const publicIdWithExt = `${folderPart}/${lastPart}`;
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extensão

      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }

    // Remove a URL da planilha
    rows[rowIndex][indiceFoto] = '';

    salvarPlanilha(headers, rows);

    return res.json({ success: true, message: 'Foto deletada e planilha atualizada' });
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return res.status(500).json({ message: 'Erro ao deletar foto' });
  }
});


module.exports = router;