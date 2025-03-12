import Echo from "@/myplugins/plugin";


const testfunc = (value:string)=> {
    Echo.sigmaReturn({Data:value});
}

export default testfunc;