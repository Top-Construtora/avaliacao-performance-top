import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { apiLimiter } from './middleware/rateLimit';
import { AppError } from './errors/AppError';
import { logger } from './lib/logger';
import { initSentry } from './lib/sentry';
import { captureException } from './lib/observability';
import routes from './routes';

// Carrega variáveis de ambiente e inicializa observabilidade (o quanto antes)
dotenv.config();
initSentry();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURAÇÃO DE CORS CENTRALIZADA ---

// Domínios permitidos em produção
const productionOrigins = [
  'https://avaliacao-performance-top.onrender.com',
  'https://avaliacao-performance-top.vercel.app',
];

// Domínios permitidos em desenvolvimento
const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
];

// Determina quais origens usar baseado no ambiente
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? productionOrigins
    : [...developmentOrigins, ...productionOrigins]; // Dev aceita localhost + produção

// Adiciona a URL do frontend a partir das variáveis de ambiente se ela existir
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
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
    'Access-Control-Request-Method',
  ],
  exposedHeaders: ['X-Total-Count', 'Content-Range'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// --- MIDDLEWARES ---

// Confiar no proxy do Render é crucial para obter o IP/origem correto
app.set('trust proxy', 1);

// IMPORTANTE: CORS deve vir ANTES do Helmet
app.use(cors(corsOptions));

// Helmet com configuração ajustada para não interferir com CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Vamos configurar manualmente abaixo
  }),
);

// Configuração manual de CSP para permitir fontes do Google
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "script-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https: wss: ws:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'",
  );
  next();
});

// Parsers with increased limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Prefer',
    );
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }

  next();
});

// Middleware para garantir que sempre enviamos Content-Type correto
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(data);
  };
  next();
});

// Request ID — correlation id em logs, header de resposta e Sentry
app.use(requestId);

// --- ROTAS E HANDLERS ---

// Rota raiz - página inicial da API
app.get('/', (req, res) => {
  res.json({
    message: 'API de Avaliação de performance',
    status: 'online',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Rotas da API — /api/v1 é o caminho canônico (contrato novo);
// /api é alias transitório p/ o frontend atual (legado). Ver docs/adr/0001.
app.use(
  '/api/v1',
  apiLimiter,
  (req, res, next) => {
    res.locals.apiVersion = 'v1';
    next();
  },
  routes,
);
app.use('/api', apiLimiter, routes);

// Handler para rotas não encontradas (404) — flui pelo errorHandler
// para respeitar o contrato da versão (v1 estruturado / legado string).
app.use('*', (req, _res, next) => {
  next(new AppError('NOT_FOUND', `Rota não encontrada: ${req.method} ${req.originalUrl}`));
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// --- INICIALIZAÇÃO DO SERVIDOR ---

// Handler de erros não capturados
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  captureException(error, { path: 'process', method: 'uncaughtException' });
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Rejection');
  captureException(reason, { path: 'process', method: 'unhandledRejection' });
});

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
      allowedOrigins,
    },
    'Servidor iniciado',
  );
});

export default app;
