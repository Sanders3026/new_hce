import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Capacitor } from '@capacitor/core';
import { HCECapacitorPlugin } from "capacitor-hce-plugin";  // Ensure the plugin is correctly imported

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

  // Detect if the plugin is ready (on Android)
  useEffect(() => {
    if (Capacitor.getPlatform() === "android") {
      if (HCECapacitorPlugin) {
        setPluginLoaded(true); 
      } else {
        console.error("HCE plugin not available!");
      }
    }
  }, []);

  const change = (e:CustomEvent) => {
    const newValue = e.detail.value || "";
    setDatas(newValue);
    datasRef.current = newValue;
  };

  const startEmulation = async () => {
    if (!pluginLoaded) {
      alert("NFC plugin is not yet loaded. Please try again.");
      return;
    }

    if (Capacitor.getPlatform() === 'android') {
      if (datasRef.current) {
        try {
          await HCECapacitorPlugin.startNfcHce({
            content: datasRef.current,
            persistMessage: false,
            mimeType: "text/plain",
          });
          setStarted(true);
        } catch (error) {
          console.error("Error starting NFC emulation:", error);
          alert("Failed to start NFC emulation. Please ensure NFC is enabled on your device.");
        }
      } else {
        alert("Please enter data to emulate.");
      }
    } else {
      alert("This feature is only available on Android.");
    }
  };

  const stopEmulation = async () => {
    if (Capacitor.getPlatform() === 'android') {
      try {
        await HCECapacitorPlugin.stopNfcHce();
        setStarted(false);
      } catch (error) {
        console.error("Error stopping NFC emulation:", error);
        alert("Failed to stop NFC emulation.");
      }
    }
  };

  const scanCompletedRef = useRef(false);

  useEffect(() => {
    if (Capacitor.getPlatform() === 'android' && pluginLoaded) {
      // Set up event listener for NFC status
      const listener = HCECapacitorPlugin.addListener("onStatusChanged", (status: any) => {
        console.log("NFC Status:", status.eventName);

        if (status.eventName === "card-emulator-started") {
          setStarted(true);
        }
        if (status.eventName === "card-emulator-stopped") {
          setTimeout(() => {
            setStarted(false);
          }, 2900);
        }
        if (status.eventName === "scan-completed" && !scanCompletedRef.current) {
          scanCompletedRef.current = true;
          setScanCompleted(true);
          console.log("NFC scan successful!");
          setTimeout(() => {
            scanCompletedRef.current = false;
            setScanCompleted(false);
          }, 3000);
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