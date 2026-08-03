import rateLimit from 'express-rate-limit';

// Rate limiting (achado H4). O app já confia no proxy do Render
// (`app.set('trust proxy', 1)`), então o IP do cliente é resolvido corretamente.

// Em desenvolvimento o limite geral fica folgado: o app dispara dezenas de
// requests por navegação e testes automatizados/e2e locais estouravam os 300
// em minutos, derrubando a sessão com 429. Produção segue com o limite normal.
const isDev = process.env.NODE_ENV !== 'production';

// Limite geral para toda a superfície da API — barra abuso/scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isDev ? 100000 : 300, // por IP, por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
});

// Limite para envio de resposta em pesquisa pública (link aberto, sem login).
// Generoso o bastante para uma sala/treinamento inteiro atrás do mesmo IP (NAT),
// mas ainda barra automação/spam.
export const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // respostas por IP, por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas respostas enviadas deste local. Tente novamente em alguns minutos.',
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
