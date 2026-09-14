import {
  loginIcon,
  ExcalLogo,
  eyeIcon,
  GithubIcon,
  XBrandIcon,
  DiscordIcon,
} from "@excalidraw/excalidraw/components/icons";
import { useI18n } from "@excalidraw/excalidraw/i18n";
import { MainMenu } from "@excalidraw/excalidraw/index";
import React from "react";

import { isDevEnv } from "@excalidraw/common";

import type { Theme } from "@excalidraw/element/types";

import { LanguageList } from "../app-language/LanguageList";
import {
  FORK_VERSION_LABEL,
  FORK_VERSION_TITLE,
  isExcalidrawPlusSignedUser,
} from "../app_constants";

import { saveDebugState } from "./DebugCanvas";

const AppMenuLinks = () => {
  const { t } = useI18n();
  const plusHref = `${
    import.meta.env.VITE_APP_PLUS_LP
  }/plus?utm_source=excalidraw&utm_medium=app&utm_content=hamburger`;
  const authHref = `${import.meta.env.VITE_APP_PLUS_APP}${
    isExcalidrawPlusSignedUser ? "" : "/sign-up"
  }?utm_source=signin&utm_medium=app&utm_content=hamburger`;

  return (
    <MainMenu.ItemCustom
      className="app-main-menu-links"
      data-testid="app-main-menu-links"
    >
      <a
        href={plusHref}
        target="_blank"
        rel="noopener"
        className="app-main-menu-links__item"
        aria-label="Excalidraw+"
        title="Excalidraw+"
      >
        {ExcalLogo}
      </a>
      <a
        href="https://github.com/excalidraw/excalidraw"
        target="_blank"
        rel="noopener"
        className="app-main-menu-links__item"
        aria-label="GitHub"
        title="GitHub"
      >
        {GithubIcon}
      </a>
      <a
        href="https://x.com/excalidraw"
        target="_blank"
        rel="noopener"
        className="app-main-menu-links__item"
        aria-label="Follow us on X"
        title="Follow us on X"
      >
        {XBrandIcon}
      </a>
      <a
        href="https://discord.gg/UexuTaE"
        target="_blank"
        rel="noopener"
        className="app-main-menu-links__item"
        aria-label="Discord chat"
        title="Discord chat"
      >
        {DiscordIcon}
      </a>
      <a
        href={authHref}
        target="_blank"
        rel="noopener"
        className="app-main-menu-links__item app-main-menu-links__item--accent"
        aria-label={
          isExcalidrawPlusSignedUser ? t("labels.signIn") : t("labels.signUp")
        }
        title={
          isExcalidrawPlusSignedUser ? t("labels.signIn") : t("labels.signUp")
        }
      >
        {loginIcon}
      </a>
    </MainMenu.ItemCustom>
  );
};

export const AppMainMenu: React.FC<{
  onCollabDialogOpen: () => any;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
  theme: Theme | "system";
  refresh: () => void;
}> = React.memo((props) => {
  return (
    <MainMenu>
      <MainMenu.DefaultItems.NewFile />
      <MainMenu.DefaultItems.LoadScene />
      <MainMenu.DefaultItems.RecentFiles />
      <MainMenu.DefaultItems.SaveToActiveFile />
      <MainMenu.DefaultItems.Export />
      <MainMenu.DefaultItems.SaveAsImage />
      {props.isCollabEnabled && (
        <MainMenu.DefaultItems.LiveCollaborationTrigger
          isCollaborating={props.isCollaborating}
          onSelect={() => props.onCollabDialogOpen()}
        />
      )}
      <MainMenu.DefaultItems.CommandPalette className="highlighted" />
      <MainMenu.DefaultItems.SearchMenu />
      <MainMenu.DefaultItems.Help />
      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />
      {isDevEnv() && (
        <MainMenu.Item
          icon={eyeIcon}
          onSelect={() => {
            if (window.visualDebug) {
              delete window.visualDebug;
              saveDebugState({ enabled: false });
            } else {
              window.visualDebug = { data: [] };
              saveDebugState({ enabled: true });
            }
            props?.refresh();
          }}
        >
          Visual Debug
        </MainMenu.Item>
      )}
      <MainMenu.Separator />
      <MainMenu.DefaultItems.Preferences />
      <MainMenu.DefaultItems.ToggleTheme allowSystemTheme theme={props.theme} />
      <MainMenu.ItemCustom>
        <LanguageList style={{ width: "100%" }} />
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
      <MainMenu.Separator />
      <AppMenuLinks />
      <MainMenu.ItemCustom
        className="app-main-menu-version"
        data-testid="app-main-menu-version"
      >
        <span title={FORK_VERSION_TITLE}>{FORK_VERSION_LABEL}</span>
      </MainMenu.ItemCustom>
    </MainMenu>
  );
});
