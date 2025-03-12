import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import testfunc from "./TEST";

interface NfcContextType {
  datas: string;
  setDatas: (value: string) => void;
  showToast: boolean;
  started: boolean;
  scanCompleted: boolean;
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
  const [pluginLoaded, setPluginLoaded] = useState(false);
  const HCECapacitorPlugin = useRef<any>(null);

  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      console.warn("NFC emulation is only supported on Android.");
      return;
    }

    const loadPlugin = async () => {
      try {
        setPluginLoaded(true);
      } catch (error) {
        console.error("Failed to load NFC plugin:", error);
      }
    };

    loadPlugin();
  }, []);

  const change = (e: CustomEvent) => {
    const newValue = e.detail.value || "";
    setDatas(newValue);
    datasRef.current = newValue;
  };

  const startEmulation = async () => {
    if (Capacitor.getPlatform() === "ios") {
      // For iOS, use the testfunc (assuming it's defined in ./TEST)
      if (datasRef.current) {
        try {
          testfunc;
          setStarted(true);
        } catch (error) {
          console.error("Error starting NFC emulation on iOS:", error);
          alert(`Failed to start NFC emulation on iOS: ${error}`);
        }
      } else {
        alert("Please enter data to emulate.");
      }
    } else if (Capacitor.getPlatform() === "android") {
      // For Android, use the startNfcHce
      if (datasRef.current) {
        try {
          await HCECapacitorPlugin.current.startNfcHce({
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
    if (Capacitor.getPlatform() !== "android") {
      alert("NFC emulation is only supported on Android.");
      return;
    }

    if (HCECapacitorPlugin.current) {
      try {
        await HCECapacitorPlugin.current.stopNfcHce();
        setStarted(false);
      } catch (error) {
        console.error("Error stopping NFC emulation:", error);
        alert("Failed to stop NFC emulation.");
      }
    }
  };

  useEffect(() => {
    if (Capacitor.getPlatform() === "android" && pluginLoaded) {
      const listener = HCECapacitorPlugin.current.addListener("onStatusChanged", (status: any) => {
        console.log("NFC Status:", status.eventName);

        if (status.eventName === "card-emulator-started") {
          setStarted(true);
        }
        if (status.eventName === "card-emulator-stopped") {
          setTimeout(() => {
            setStarted(false);
          }, 2900);
        }
        if (status.eventName === "scan-completed") {
          setScanCompleted(true);
          setTimeout(() => setScanCompleted(false), 3000);
        }
      });

      return () => {
        listener.remove();
      };
    }
  }, [pluginLoaded]);

  return (
    <NfcContext.Provider
      value={{
        datas,
        setDatas,
        showToast,
        change,
        startEmulation,
        stopEmulation,
        started,
        scanCompleted,
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