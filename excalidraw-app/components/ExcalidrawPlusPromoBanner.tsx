export const ExcalidrawPlusPromoBanner = ({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) => {
  const plusAppHref = import.meta.env.VITE_APP_PLUS_APP;
  const plusLandingPage = import.meta.env.VITE_APP_PLUS_LP;
  const guestPlusHref = `${plusLandingPage}/plus?utm_source=excalidraw&utm_medium=app&utm_content=guestBanner#excalidraw-redirect`;

  return (
    <a
      href={isSignedIn ? plusAppHref : guestPlusHref}
      target="_blank"
      rel="noopener"
      className="plus-banner"
    >
      Excalidraw+
    </a>
  );
};
