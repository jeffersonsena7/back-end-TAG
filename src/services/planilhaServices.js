const XLSX = require('xlsx');
const path = require('path');

function lerPlanilha() {
  const filePath = path.join(__dirname, '..', 'uploads', 'motores.xlsx');
  const workbook = XLSX.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = data[0];
  const rows = data.slice(1);
  return { headers, rows };
}

function salvarPlanilha(headers, rows) {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const filePath = path.join(__dirname, '..', 'uploads', 'motores.xlsx');
  XLSX.writeFile(wb, filePath);
}

module.exports = { lerPlanilha, salvarPlanilha };
