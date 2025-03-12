import { registerPlugin } from '@capacitor/core';

export interface EchoPlugin {
  sigmaReturn(options: { Data: string }): Promise<{ Data: string }>;
}

const Echo = registerPlugin<EchoPlugin>('EchoBack');

 export default Echo;