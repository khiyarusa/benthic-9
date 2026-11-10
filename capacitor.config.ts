import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.citywithoutdawn.benthic9',
  appName: 'BENTHIC-9',
  webDir: 'dist',
  backgroundColor: '#01070c',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
