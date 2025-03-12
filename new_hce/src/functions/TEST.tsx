import Echo from "@/myplugins/plugin";
import { useNfc } from '../functions/MyFunctions';


const testfunc = ()=> {
    const { datas } = useNfc();
    Echo.sigmaReturn({Data:datas});
}

export default testfunc;