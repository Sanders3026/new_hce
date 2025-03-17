import { registerPlugin } from '@capacitor/core';

export interface EchoPlugin {
  IosEmulator(options: { Data: string }): Promise<{ Data: string }>;
}

const Echo = registerPlugin<EchoPlugin>('IosEmulator');

 export default Echo;