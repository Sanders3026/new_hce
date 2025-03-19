import { registerPlugin } from '@capacitor/core';

export interface EchoPlugin {
  StartEmulation(options: { Data: string }): Promise<{ Data: string }>;
  addListener(eventName: 'sessionInvalidated', listener: (event: any) => void): Promise<void>;
  removeListener(eventName: 'sessionInvalidated', listener: (event: any) => void): Promise<void>;
}

const Echo = registerPlugin<EchoPlugin>('IosEmulator');

 export default Echo;