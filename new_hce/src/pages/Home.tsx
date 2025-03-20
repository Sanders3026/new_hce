import React from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonItem, IonInput, IonText, IonLabel,
  IonIcon, IonCard, IonProgressBar,IonImg
} from '@ionic/react';
import { radioOutline, checkmarkDoneCircleOutline, alertCircleOutline } from "ionicons/icons";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { documentOutline } from 'ionicons/icons';
import { useNfc } from '../functions/MyFunctions';
import { Button } from "@/components/ui/button"
import '../css/style.css';
import { Capacitor } from '@capacitor/core'; 
import Modal from '@/components/AndroidSheet';

const Home: React.FC = () => {
  const { datas, startEmulation, stopEmulation, change, started, scanCompleted, scanError } = useNfc();

  let isAndroid = false;
  if (Capacitor.getPlatform() === "android"){
    isAndroid = true;
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ backgroundColor: 'var(--ion-background-)' }}>
        {started && !scanCompleted && !scanError && (
          <div className="nfc-tag-overlay">
            <div className="nfc-tag">
                <img 
                  src="https://docs-demo.ionic.io/assets/madison.jpg" 
                  alt="NFC Tag" 
                  style={{ width: '100%', height: '100%' ,objectFit: "cover" }}
                />
            </div>
          </div>
        )}

        <IonButton 
          expand="block" 
          onClick={startEmulation} 
          aria-label="Start NFC Emulation"
          style={{ marginTop: '2rem' }}
        >
          Start Emulation
        </IonButton>
        <IonItem>
          <IonInput
            labelPlacement="floating"
            value={datas}
            onIonChange={change}>
            <div slot="label">
              Enter NFC Message <IonText color="danger">(Required)</IonText>
            </div>
          </IonInput>
        </IonItem>
      </IonContent>

      {/* Conditionally Render BottomSheet on Android only */}
      {isAndroid && (
      <BottomSheet 
      open={started} 
      onDismiss={stopEmulation} 
      blocking={false} 
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
            
            <Modal></Modal>
          
           

            {/* stop session button */}
            <Button onClick={stopEmulation} variant={"outline"} className='my-custom-button outline'>Stop Session</Button>
         
          </div>
        </BottomSheet>
      )}
    </IonPage>
  );
};

export default Home;