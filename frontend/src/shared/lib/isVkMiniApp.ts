type VkMiniAppGlobal = {
  VK?: {
    init?: (params: { apiId: number }) => void;
    getParams?: () => string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Проверяет, запущено ли приложение внутри VK Mini App.
 * Проверяет наличие VK SDK и vk-params в URL или через VK.getParams()
 */
export function isVkMiniApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const global = window as unknown as VkMiniAppGlobal;
  const vk = global.VK;

  if (!vk || typeof vk !== "object") {
    return false;
  }

  // Проверяем наличие vk-params в URL
  const urlParams = new URLSearchParams(window.location.search);
  const vkParamsInUrl = urlParams.get("vk-params");

  // Проверяем наличие метода getParams в VK SDK
  const hasGetParams = typeof vk.getParams === "function";

  // Проверяем наличие метода init в VK SDK
  const hasInit = typeof vk.init === "function";

  // Если есть vk-params в URL или есть методы VK SDK - это Mini App
  return !!(vkParamsInUrl || (hasGetParams && hasInit));
}

/**
 * Получает vk-params из URL или через VK SDK
 */
export function getVkParams(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Сначала проверяем URL
  const urlParams = new URLSearchParams(window.location.search);
  const vkParamsInUrl = urlParams.get("vk-params");
  if (vkParamsInUrl) {
    return vkParamsInUrl;
  }

  // Потом пробуем через VK SDK
  const global = window as unknown as VkMiniAppGlobal;
  const vk = global.VK;
  if (vk?.getParams && typeof vk.getParams === "function") {
    try {
      return vk.getParams();
    } catch {
      return null;
    }
  }

  return null;
}

