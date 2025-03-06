import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Capacitor } from '@capacitor/core';

interface HcePlugin {
  startNfcHce: (options: { content: string; persistMessage: boolean; mimeType: string }) => Promise<void>;
  stopNfcHce: () => Promise<void>;
  addListener: (event: string, callback: (status: any) => void) => { remove: () => void };
}

let hcePlugin: any

interface NfcContextType {
  datas: string;
  setDatas: (value: string) => void;
  showToast: boolean;
  started: boolean;
  scanCompleted: boolean;
  change: (e: CustomEvent<{ value: string }>) => void;
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

  useEffect(() => {
    if (Capacitor.getPlatform() === 'android') {
      import('capacitor-hce-plugin')
        .then((plugin) => {
          hcePlugin = plugin;
          setPluginLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load capacitor-hce-plugin:', error);
          alert('NFC plugin is not available. Please ensure the plugin is installed correctly.');
        });
    } else {
      setPluginLoaded(true); // Allow non-Android platforms to proceed
    }
  }, []);

  const change = (e: CustomEvent<{ value: string }>) => {
    const newValue = e.detail.value || "";
    setDatas(newValue);
    datasRef.current = newValue;
  };

  const startEmulation = async () => {
    if (!pluginLoaded) {
      alert("NFC plugin is not yet loaded. Please try again.");
      return;
    }

    if (Capacitor.getPlatform() === 'android' && hcePlugin) {
      if (datasRef.current) {
        try {
          await hcePlugin.startNfcHce({
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
    if (Capacitor.getPlatform() === 'android' && hcePlugin) {
      try {
        await hcePlugin.stopNfcHce();
        setStarted(false);
      } catch (error) {
        console.error("Error stopping NFC emulation:", error);
        alert("Failed to stop NFC emulation.");
      }
    }
  };

  const scanCompletedRef = useRef(false);

  useEffect(() => {
    if (Capacitor.getPlatform() === 'android' && pluginLoaded && hcePlugin) {
      const listener = hcePlugin.addListener("onStatusChanged", (status: any) => {
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