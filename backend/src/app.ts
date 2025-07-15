import express from 'express';
import cors, { CorsOptions } from 'cors'; // Importe CorsOptions
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURAÇÃO DE CORS CENTRALIZADA ---

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://avaliacao-desempenho-six.vercel.app', 
];

// Adiciona a URL do frontend a partir das variáveis de ambiente se ela existir
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman, apps mobile, ou server-to-server)
    // Em produção, você pode querer restringir isso por segurança.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Loga a origem bloqueada para facilitar o debug
      console.error(`CORS Bloqueado para a origem: ${origin}`);
      callback(new Error('Acesso não permitido por CORS'));
    }
  },
  credentials: true, // Essencial para cookies e autenticação
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
};

// --- MIDDLEWARES ---

// Confiar no proxy do Render é crucial para obter o IP/origem correto
app.set('trust proxy', 1); 

// Middlewares de segurança
app.use(helmet());
app.use(cors(corsOptions)); // Use a configuração centralizada aqui

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROTAS E HANDLERS ---

// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rotas da API
app.use('/api', routes);

// Handler para rotas não encontradas (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// --- INICIALIZAÇÃO DO SERVIDOR ---

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Origens permitidas pelo CORS:', allowedOrigins);
});

export default app;