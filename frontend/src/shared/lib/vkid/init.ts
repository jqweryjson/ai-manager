import { Config, ConfigResponseMode, ConfigSource } from "@vkid/sdk";

export type InitVkidParams = {
  appId: number;
  redirectUrl: string;
  scope?: string;
};

/**
 * Инициализация VK ID SDK (low-code / callback mode).
 */
export function initVkid({ appId, redirectUrl, scope }: InitVkidParams) {
  Config.init({
    app: appId,
    redirectUrl,
    responseMode: ConfigResponseMode.Callback,
    source: ConfigSource.LOWCODE,
    ...(scope ? { scope } : {}),
  });
}
