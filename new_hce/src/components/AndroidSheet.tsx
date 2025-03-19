import React from "react"
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonPage,
  IonIcon,
  IonText,
  IonLabel,
  IonCard,
  IonProgressBar,

} from "@ionic/react";
import { Button } from "@/components/ui/button"
import { BottomSheet } from "react-spring-bottom-sheet";
import { Capacitor } from "@capacitor/core";
import { useNfc } from "@/functions/MyFunctions";
import { radioOutline, checkmarkDoneCircleOutline, alertCircleOutline } from "ionicons/icons";
const { stopEmulation, started, scanCompleted, scanError } = useNfc();

let isAndroid = false;
if (Capacitor.getPlatform() === "android"){
  isAndroid = true;
}
interface ContainerProps { }

const Modal: React.FC<ContainerProps> = () => {
  return(
    <IonPage>
    {isAndroid && (
        <BottomSheet 
          open={started} 
          onDismiss={stopEmulation}
        >
          <div className="ion-padding-horizontal" style={{ paddingBottom: '2rem' }}>
            <div className="ion-text-center" style={{ margin: '1.5rem 0' }}>
              <IonIcon
                icon={scanError ? alertCircleOutline : scanCompleted ? checkmarkDoneCircleOutline : radioOutline}
                color={scanError ? "danger" : scanCompleted ? "success" : "primary"}
                style={{
                  fontSize: "64px",
                  transition: 'all 0.3s ease',
                  transform: (scanCompleted || scanError) ? 'scale(1.1)' : 'scale(1)',
                  filter: started && !scanCompleted && !scanError ? 'drop-shadow(0 0 8px var(--ion-color-primary))' : 'none'
                }}
              />
            </div>

            <div className="ion-text-center" style={{ marginBottom: '2rem' }}>
              <IonText color={scanError ? "danger" : scanCompleted ? "success" : "medium"}>
                <h1 style={{ 
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  margin: '0.5rem 0'
                }}>
                  {scanError ? 'Scan Error!' : scanCompleted ? 'Data Transmitted!' : started ? 'Ready to Scan' : 'Session Ended'}
                </h1>
              </IonText>
              <IonText color="medium">
                <p style={{ 
                  fontSize: '0.9rem',
                  margin: '0.5rem 0',
                  lineHeight: '1.4'
                }}>
                  {scanError 
                    ? 'There was an error during the NFC scan. Please try again.'
                    : scanCompleted 
                    ? 'The data was successfully received by the scanner device'
                    : started 
                    ? 'Hold your device near an NFC reader to transmit data'
                    : 'NFC emulation has been stopped'}
                </p>
              </IonText>
            </div>

            

            {/* stop session button */}
            <Button onClick={stopEmulation} variant={"outline"} className='my-custom-button outline'>Stop Session</Button>
         
          </div>
        </BottomSheet>
      )}
      </IonPage>
  )
}

export default Modal;