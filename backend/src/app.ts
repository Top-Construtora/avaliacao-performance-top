import express from 'express';
import cors, { CorsOptions } from 'cors';
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
  'http://localhost:3001',
  'https://avaliacao-desempenho-six.vercel.app', 
];

// Adiciona a URL do frontend a partir das variáveis de ambiente se ela existir
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: Postman, apps mobile, ou server-to-server)
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
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Prefer',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method'
  ],
  exposedHeaders: ['X-Total-Count', 'Content-Range'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// --- MIDDLEWARES ---

// Confiar no proxy do Render é crucial para obter o IP/origem correto
app.set('trust proxy', 1); 

// IMPORTANTE: CORS deve vir ANTES do Helmet
app.use(cors(corsOptions));

// Helmet com configuração ajustada para não interferir com CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginEmbedderPolicy: false,
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware adicional para garantir CORS em todas as respostas
app.use((req, res, next) => {
  // Se a origem está na lista permitida, adiciona os headers
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Para requisições OPTIONS, responde imediatamente
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Prefer');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }
  
  next();
});

// Logging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.headers.origin) {
    }
    next();
  });
}

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
  console.log('✅ Origens permitidas pelo CORS:');
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
});

export default app;