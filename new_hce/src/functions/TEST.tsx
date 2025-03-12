import Echo from "@/myplugins/plugin";
import { useNfc } from '../functions/MyFunctions';

const { datas } = useNfc();

const testfunc = ()=> {
    
    Echo.sigmaReturn({Data:datas});
}

export default testfunc;