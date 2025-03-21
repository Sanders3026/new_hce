import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import StartIosEmulation from "./IosEmulation";
import Echo from "@/myplugins/IosPlugin";
import {HCECapacitorPlugin} from "capacitor-hce-plugin"
interface NfcContextType {
  datas: string;
  setDatas: (value: string) => void;
  showToast: boolean;
  started: boolean;
  scanCompleted: boolean;
  scanError: boolean;
  change: (e: CustomEvent) => void;
  startEmulation: () => Promise<void>;
  stopEmulation: () => Promise<void>;
}


const NfcContext = createContext<NfcContextType | undefined>(undefined);

export const NfcProvider = ({ children }: { children: ReactNode }) => {
  const [showToast, setShowToast] = useState(false);
  const [datas, setDatas] = useState<string>("");
  const [started, setStarted] = useState(false);
  const datasRef = useRef<string>("");
  const [scanCompleted, setScanCompleted] = useState(false);
  const [scanError, setScanError] = useState(false);

 

 
  if (Capacitor.getPlatform()==="ios") {
    
  useEffect(() => {
    const listener = Echo.addListener("sessionInvalidated", (event) => {
      setStarted(false);  
      
    });
  
    return () => {

    };
  }, []);
}
  const change = (e: CustomEvent) => {
    const newValue = e.detail.value || "";
    setDatas(newValue);
    datasRef.current = newValue;
  };

  const startEmulation = async () => {
    if (Capacitor.getPlatform() === "ios") {
      if (datasRef.current) {
        try {
          StartIosEmulation(datasRef.current);
          setStarted(true);
        } catch (error) {
          console.error("Error starting NFC emulation on iOS:", error);
          console.log(error);
          alert(`Failed to start NFC emulation on iOS: ${error}`);
        }
      } else {
        alert("Please enter data to emulate.");
      }
    } else if (Capacitor.getPlatform() === "android") {
      // For Android, use the startNfcHce
      if (datasRef.current) {
        try {
          await HCECapacitorPlugin.startNfcHce({
            content: datasRef.current,
            persistMessage: false,
            mimeType: "text/plain",
          });
          setStarted(true);
        } catch (error) {
          console.error("Error starting NFC emulation on Android:", error);
          alert(`Failed to start NFC emulation on Android: ${error}`);
        }
      } else {
        alert("Please enter data to emulate.");
      }
    } else {
      alert("NFC emulation is only supported on iOS and Android.");
    }
  };

  const stopEmulation = async () => {
    setStarted(false);
    if (HCECapacitorPlugin) {
      try {
        await HCECapacitorPlugin.stopNfcHce();
      } catch (error) {
        console.error("Error stopping NFC emulation:", error);
        alert("Failed to stop NFC emulation.");
      }
    }
  };

  useEffect(() => {
    if (Capacitor.getPlatform() === "android") {
      const listener = HCECapacitorPlugin.addListener("onStatusChanged", (status: any) => {
        console.log("NFC Status:", status.eventName);

        if (status.eventName === "card-emulator-started") {
          setStarted(true);
        }
        if (status.eventName === "scan-completed") {
          setScanCompleted(true);
          setTimeout(() => setScanCompleted(false), 3000);
          setTimeout(() => {
            setStarted(false);
          }, 2900);
        }
        if (status.eventName === "scan-error") {
          setScanError(true);
          setScanCompleted(false);
          setTimeout(() => setScanError(false), 3000);
        }
      });

      return () => {
        listener.remove();
      };
    }
  }, []);

  return (
    <NfcContext.Provider
      value={{
        datas,
        setDatas,
        showToast,
        started,
        scanCompleted,
        scanError,
        change,
        startEmulation,
        stopEmulation,
      }}
    >
      {children}
    </NfcContext.Provider>
  );
};

export const useNfc = () => {
  const context = useContext(NfcContext);
  if (!context) {
    throw new Error("useNfc must be used within an NfcProvider");
  }
  return context;
};