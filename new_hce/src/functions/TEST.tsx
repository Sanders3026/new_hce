import Echo from "@/myplugins/plugin";


const StartIosEmulation = (value:string)=> {
    Echo.IosEmulator({Data:value});
}

export default StartIosEmulation;