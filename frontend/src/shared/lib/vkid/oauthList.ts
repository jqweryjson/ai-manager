import {
  OAuthList,
  OAuthListInternalEvents,
  OAuthName,
  WidgetEvents,
} from "@vkid/sdk";
import type { AuthResponse, OAuthListParams, OAuthListStyles } from "@vkid/sdk";

export type RenderOAuthListParams = {
  container: HTMLElement;
  oauthList?: OAuthName[];
  styles?: OAuthListStyles;
  onError?: (err: unknown) => void;
  onLoginSuccess: (payload: AuthResponse) => void | Promise<void>;
};

/**
 * Рендерит VK ID OAuthList widget в контейнер и подписывается на события.
 * Возвращает widget instance (есть .close()).
 */
export function renderVkidOAuthList({
  container,
  oauthList = [OAuthName.VK],
  styles,
  onError,
  onLoginSuccess,
}: RenderOAuthListParams) {
  const widget = new OAuthList().render({
    container,
    oauthList,
    ...(styles ? { styles } : {}),
  } satisfies OAuthListParams);

  widget.on(WidgetEvents.ERROR, onError ?? (() => {}));
  widget.on(OAuthListInternalEvents.LOGIN_SUCCESS, (payload: unknown) => {
    // SDK по факту отдаёт AuthResponse
    void onLoginSuccess(payload as AuthResponse);
  });

  return widget;
}
