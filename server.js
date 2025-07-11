const express = require('express');
const cors = require('cors');

const planilhaRouter = require('./src/routes/planilha');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Monta as rotas prefixadas
app.use('/api/planilha', planilhaRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
