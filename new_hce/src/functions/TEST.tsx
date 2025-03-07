import { HCEPlugin } from "sandijs-hce-nfc";

const sigma = async () => {
  await HCEPlugin.setEmulationString({value: "test"});
  console.log("aizgaja")
  console.log(HCEPlugin.checkHceSupport)

}

export default sigma