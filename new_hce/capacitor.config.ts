import type { CapacitorConfig } from '@capacitor/cli';
import { Capacitor } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'new_hce',
  webDir: 'dist',
  plugins: {
    "capacitor-hce-plugin": Capacitor.getPlatform() === "ios" ? {} : undefined
  }
};

export default config;
