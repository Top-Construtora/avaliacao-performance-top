import './gioLoader.css';
import gioWordmark from '@/assets/images/gioWordmark.png';

interface GioLoadingProps {
  /** Texto exibido abaixo do anel. Default: "Carregando…". */
  text?: string;
  /**
   * Mantido por compatibilidade de API. O loader é sempre um overlay
   * de tela cheia (fixed inset-0), espelhando o GioLoader do GIO.
   */
  fullScreen?: boolean;
}

/**
 * Tela de carregamento — réplica estrita do GioLoader do GIO (identidade v4.0):
 * fundo obsidian com grid lime mascarado, anel cinza + arco lime girando/pulsando
 * e "Carregando…". A logo central é a mesma wordmark da sidebar (invertida p/ branco).
 */
export function GioLoading({ text = 'Carregando…' }: GioLoadingProps) {
  return (
    <div className="gio-loader" role="status" aria-label={text}>
      <div className="gio-loader-ring">
        <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
          <circle className="track" cx="48" cy="48" r="43" />
          <circle className="progress" cx="48" cy="48" r="43" />
        </svg>
        <img src={gioWordmark} alt="GIO" className="gio-loader-logo" />
      </div>
      <p className="gio-loader-text">{text}</p>
    </div>
  );
}

export default GioLoading;
