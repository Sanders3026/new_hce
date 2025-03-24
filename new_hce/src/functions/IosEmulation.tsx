import { HCECapacitorPlugin } from "capacitor-hce-plugin/dist/esm";

const StartIosEmulation = (value:string)=> {
    HCECapacitorPlugin.StartEmulation({Data:value});
}

export default StartIosEmulation;