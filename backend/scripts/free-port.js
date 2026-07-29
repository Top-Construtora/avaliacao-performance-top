#!/usr/bin/env node
/**
 * Libera a porta do backend antes do `npm run dev`.
 *
 * Por que existe: fechar o terminal sem Ctrl+C deixa o node órfão segurando a
 * 3001. No próximo `npm run dev` o Vite sobe normalmente e só o backend morre
 * com EADDRINUSE — o app abre, mas nenhuma chamada de API funciona, e o erro
 * fica enterrado no meio do log do concurrently.
 *
 * Uso: node scripts/free-port.js [porta]   (roda sozinho pelo predev)
 */
const { execSync } = require('child_process');

const porta = process.argv[2] || process.env.PORT || '3001';

/** PIDs escutando na porta, por plataforma. Sem saída = porta livre. */
function pidsNaPorta() {
  try {
    if (process.platform === 'win32') {
      const saida = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${porta}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return [
        ...new Set(
          saida
            .split('\n')
            .map((linha) => linha.trim().split(/\s+/).pop())
            // A porta precisa ser o fim do endereço local: :3001 não pode casar com :30010
            .filter((pid, i, todos) => pid && /^\d+$/.test(pid) && todos.indexOf(pid) === i),
        ),
      ];
    }
    const saida = execSync(`lsof -ti tcp:${porta} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return saida.split('\n').filter(Boolean);
  } catch {
    // grep/findstr/lsof saem com código 1 quando não há match — porta livre.
    return [];
  }
}

const pids = pidsNaPorta();

if (pids.length === 0) {
  process.exit(0);
}

for (const pid of pids) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGKILL');
    }
    console.log(`[free-port] processo ${pid} encerrado — porta ${porta} liberada`);
  } catch {
    console.warn(
      `[free-port] não consegui encerrar o processo ${pid} na porta ${porta}. ` +
        'Se o backend não subir, encerre-o manualmente.',
    );
  }
}
