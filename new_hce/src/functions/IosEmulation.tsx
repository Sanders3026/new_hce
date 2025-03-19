import Echo from "@/myplugins/IosPlugin";


const StartIosEmulation = (value:string)=> {
    Echo.StartEmulation({Data:value});
}

export default StartIosEmulation;