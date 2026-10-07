; Inno Setup: instalador de Windows. Se compila en CI con:
;   iscc /DAppVersion=0.1.0 flutter\installers\windows.iss
#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif

[Setup]
AppId={{6F1B7C52-3D0E-4C8A-9B7F-2A5E8D41C0B3}
AppName=Imperio Barber
AppVersion={#AppVersion}
AppPublisher=Imperio Barber
DefaultDirName={autopf}\Imperio Barber
DefaultGroupName=Imperio Barber
DisableProgramGroupPage=yes
OutputDir=..\dist
OutputBaseFilename=imperio-barber-setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
UninstallDisplayIcon={app}\imperio_barber.exe

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear un acceso directo en el escritorio"; GroupDescription: "Accesos directos:"

[Files]
Source: "..\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\Imperio Barber"; Filename: "{app}\imperio_barber.exe"
Name: "{autodesktop}\Imperio Barber"; Filename: "{app}\imperio_barber.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\imperio_barber.exe"; Description: "Abrir Imperio Barber"; Flags: nowait postinstall skipifsilent
