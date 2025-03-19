import Echo from "@/myplugins/plugin";


const StartIosEmulation = (value:string)=> {
    Echo.StartEmulation({Data:value});
}

export default StartIosEmulation;