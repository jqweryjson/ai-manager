import { useState, useEffect } from "react";
import { BREAKPOINTS } from "@shared/config/breakpoints";

/**
 * Хук для определения мобильной версии
 * Синхронизирован с CSS переменной --mobile-breakpoint-width
 * @returns { isMobile: boolean } - true если ширина экрана <= BREAKPOINTS.mobile
 */
export function useIsMobile(): { isMobile: boolean } {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= BREAKPOINTS.mobile;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${BREAKPOINTS.mobile}px)`
    );

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Проверяем сразу
    setIsMobile(mediaQuery.matches);

    // Подписываемся на изменения
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { isMobile };
}
