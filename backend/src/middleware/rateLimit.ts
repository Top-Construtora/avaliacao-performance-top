import rateLimit from 'express-rate-limit';

// Rate limiting (achado H4). O app já confia no proxy do Render
// (`app.set('trust proxy', 1)`), então o IP do cliente é resolvido corretamente.

// Limite geral para toda a superfície da API — barra abuso/scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300, // por IP, por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
});

// Limite estrito para autenticação — barra brute-force de senha.
// Não conta logins bem-sucedidos, para não punir o uso legítimo.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // tentativas por IP, por janela
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
  },
});
