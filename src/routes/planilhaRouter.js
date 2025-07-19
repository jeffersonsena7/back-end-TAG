const XLSX = require('xlsx');
const path = require('path');

function lerPlanilha() {
  const filePath = path.join(__dirname, '..', 'uploads', 'motores.xlsx');
  const workbook = XLSX.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return { workbook, worksheet, data, filePath };
}

function salvarPlanilha(editData) {
  const { workbook, data, filePath } = lerPlanilha();

  let headers = data[0];
  let rows = data.slice(1);

  const indiceTag = headers.findIndex(h => ['tag', 'TAG', 'Tag'].includes(h));
  if (indiceTag === -1) throw new Error('Coluna Tag não encontrada');

  const tagEditada = editData[headers[indiceTag]];
  const rowIndex = rows.findIndex(row => row[indiceTag] === tagEditada);
  if (rowIndex === -1) throw new Error('Tag não encontrada na planilha');

  // Garantir que a coluna publicId exista
  let indicePublicId = headers.findIndex(h => h.toLowerCase() === 'publicid');
  if (indicePublicId === -1) {
    headers.push('publicId');
    // Adiciona uma célula vazia para cada linha para a nova coluna
    rows = rows.map(row => [...row, '']);
    indicePublicId = headers.length - 1;
  }

  // Montar a nova linha, incluindo o publicId do editData (se existir)
  const novaLinha = headers.map(h => {
    if (h === 'publicId') return editData.publicId ?? rows[rowIndex][indicePublicId];
    return editData[h] ?? '';
  });

  rows[rowIndex] = novaLinha;

  const novaData = [headers, ...rows];
  const novaWorksheet = XLSX.utils.aoa_to_sheet(novaData);
  workbook.Sheets[workbook.SheetNames[0]] = novaWorksheet;

  XLSX.writeFile(workbook, filePath);
}

module.exports = { lerPlanilha, salvarPlanilha };
