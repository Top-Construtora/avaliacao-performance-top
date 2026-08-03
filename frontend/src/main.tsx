import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// DM Sans é a fonte primária declarada no tailwind.config (body e font-gio);
// sem estes imports o app caía no fallback (Space Grotesk/sistema).
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Service worker (PWA) — atualização automática do app shell em cache
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
