import React from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonItem, IonInput, IonText, IonLabel,
  IonIcon, IonCard
} from '@ionic/react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { radioOutline, checkmarkDoneCircleOutline } from "ionicons/icons";
import { useNfc } from '../functions/MyFunctions';
import Echo from "../myplugins/plugin"
import sigma from '@/functions/TEST';
const Home: React.FC = () => {
  const ret = async () =>{
    const result = await Echo.sigmaReturn({ value: "hello world" });
    alert(result.value);
    
  }

  const { datas, startEmulation, stopEmulation, change, started, scanCompleted } = useNfc();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>HCE Demo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ backgroundColor: 'var(--ion-background-color)' }}>
        <IonButton expand="block" onClick={sigma}>
          Start Emulation
        </IonButton>
        <IonButton expand="block" onClick={ret}>
          Stop Emulation
        </IonButton>
        <IonItem>
          <IonInput
            labelPlacement="floating"
            value={datas}
            onIonChange={(e) => change(e as CustomEvent<{ value: string }>)}
          >
            <div slot="label">
              Enter NFC Message <IonText color="danger">(Required)</IonText>
            </div>
          </IonInput>
        </IonItem>
      </IonContent>

      {/* Sheet Component */}
      <Sheet open={started || scanCompleted} onOpenChange={(open) => !open && stopEmulation()}>
        <SheetContent 
          side="bottom"
          className="w-full max-w-[400px] mx-auto rounded-t-xl"
          style={{
            top: '50%',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            height: 'min(60vh, 500px)',
            backgroundColor: 'var(--ion-background-color)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <SheetHeader className="ion-text-center ion-padding">
              <div className="ion-margin-vertical">
                <IonIcon
                  icon={scanCompleted ? checkmarkDoneCircleOutline : radioOutline}
                  color={scanCompleted ? "success" : "primary"}
                  style={{
                    fontSize: "48px",
                    animation: started && !scanCompleted ? "spin 1s linear infinite" : "none"
                  }}
                />
              </div>
              <SheetTitle className="ion-text-wrap">
                {scanCompleted ? 'Scan Successful!' : started ? 'NFC Emulation Active' : 'NFC Status'}
              </SheetTitle>

              <SheetDescription className="ion-margin-top">
                {scanCompleted ? (
                  <IonText color="success">
                    Data successfully transmitted!
                  </IonText>
                ) : started ? (
                  <IonText color="medium">
                    Waiting for NFC scanner...
                  </IonText>
                ) : (
                  <IonText color="medium">
                    Start emulation to begin scanning
                  </IonText>
                )}
              </SheetDescription>
            </SheetHeader>

            {scanCompleted && (
              <IonCard className="ion-margin">
                <IonItem lines="none">
                  <IonLabel className="ion-text-wrap">
                    <h2>Transmitted Data</h2>
                    <p style={{ wordBreak: 'break-all' }}>{datas || 'No data recorded'}</p>
                  </IonLabel>
                </IonItem>
              </IonCard>
            )}

            <SheetFooter className="ion-padding">
              <SheetClose className="ion-full-width">
                <IonButton
                  expand="block"
                  fill={scanCompleted ? "outline" : "solid"}
                  color={scanCompleted ? "success" : "primary"}
                  onClick={stopEmulation}
                >
                  {scanCompleted ? 'Close' : 'Cancel'}
                </IonButton>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </IonPage>
  );
};

export default Home;
