const express = require('express');
const cors = require('cors');

const planilhaRouter = require('./src/routes/planilha');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Monta as rotas prefixadas
app.use('/api/planilha', planilhaRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
