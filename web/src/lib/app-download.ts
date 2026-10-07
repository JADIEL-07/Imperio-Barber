const RELEASE = "https://github.com/JADIEL-07/Imperio-Barber/releases/latest/download";

/** Última versión publicada en GitHub Releases (nombres de archivo fijos). */
export const ANDROID_APK_URL = `${RELEASE}/imperio-barber.apk`;
/** IPA sin firmar: se instala con AltStore/Sideloadly. */
export const IOS_IPA_URL = `${RELEASE}/imperio-barber-unsigned.ipa`;
export const WINDOWS_SETUP_URL = `${RELEASE}/imperio-barber-setup.exe`;
export const WINDOWS_ZIP_URL = `${RELEASE}/imperio-barber-windows.zip`;
export const LINUX_DEB_URL = `${RELEASE}/imperio-barber.deb`;
export const LINUX_APPIMAGE_URL = `${RELEASE}/imperio-barber.AppImage`;

export interface DownloadTarget {
  id: string;
  platform: string;
  icon: string; // Material Symbols
  files: { label: string; url: string }[];
  steps: string[];
}

export const DOWNLOADS: DownloadTarget[] = [
  {
    id: "android",
    platform: "Android",
    icon: "android",
    files: [{ label: "Descargar APK", url: ANDROID_APK_URL }],
    steps: [
      "Abre el archivo descargado desde tu teléfono.",
      "Si Android lo pide, permite instalar apps de esta fuente.",
    ],
  },
  {
    id: "ios",
    platform: "iPhone / iPad",
    icon: "phone_iphone",
    files: [{ label: "Descargar IPA", url: IOS_IPA_URL }],
    steps: [
      "El archivo no está firmado por Apple: instálalo con AltStore o Sideloadly usando tu Apple ID.",
      "La instalación gratuita caduca a los 7 días y hay que renovarla.",
    ],
  },
  {
    id: "windows",
    platform: "Windows",
    icon: "desktop_windows",
    files: [
      { label: "Instalador (.exe)", url: WINDOWS_SETUP_URL },
      { label: "Versión portable (.zip)", url: WINDOWS_ZIP_URL },
    ],
    steps: [
      "Ejecuta el instalador. Si aparece \"Windows protegió su equipo\", pulsa Más información y luego Ejecutar de todos modos.",
      "No necesita permisos de administrador.",
    ],
  },
  {
    id: "linux",
    platform: "Linux",
    icon: "terminal",
    files: [
      { label: "Paquete .deb (Debian/Ubuntu)", url: LINUX_DEB_URL },
      { label: "AppImage (cualquier distro)", url: LINUX_APPIMAGE_URL },
    ],
    steps: [
      ".deb: sudo apt install ./imperio-barber.deb",
      "AppImage: chmod +x imperio-barber.AppImage y ejecútalo.",
    ],
  },
];
