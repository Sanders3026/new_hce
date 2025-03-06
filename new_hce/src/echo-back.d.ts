// echo-back.d.ts
import { Plugin } from '@capacitor/core';

// Define the EchoBack plugin interface
declare module '@capacitor/core' {
  interface PluginRegistry {
    EchoBack: {
      sigmaReturn(options: { value: string }): Promise<{ value: string }>;
    };
  }
}