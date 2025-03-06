import { registerPlugin } from '@capacitor/core';

export interface EchoPlugin {
  sigmaReturn(options: { value: string }): Promise<{ value: string }>;
}

const Echo = registerPlugin<EchoPlugin>('EchoBack');

 export default Echo;