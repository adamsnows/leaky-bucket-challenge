import * as React from "react";

/**
 * Breakpoint para determinar se está em dispositivo móvel (em pixels)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook para detectar se a viewport atual é de tamanho móvel
 * @returns {boolean} true se a viewport for menor que o breakpoint móvel
 */
export function useIsMobile(): boolean {
  // Inicialmente undefined até que possamos determinar no cliente
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Criando a media query
    const mql: MediaQueryList = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    // Handler para mudanças na media query
    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Adicionando event listener
    mql.addEventListener("change", onChange);

    // Definindo o estado inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Cleanup: removendo event listener
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Garantindo que retornamos um booleano mesmo que o estado inicialmente seja undefined
  return isMobile === undefined ? false : isMobile;
}
