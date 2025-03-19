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

const Home: React.FC = () => {
  const { datas, startEmulation, stopEmulation, change, started, scanCompleted, scanError } = useNfc();

  // Platform check to conditionally render BottomSheet on Android only
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

            {/* Progress Indicator */}
            {started && !scanCompleted && !scanError && (
              <div style={{ 
                margin: '1.5rem 0',
                padding: '0 1rem'
              }}>
                <IonProgressBar 
                  type="indeterminate" 
                  color="primary"
                  style={{
                    height: '4px',
                    borderRadius: '2px'
                  }}
                />
              </div>
            )}

            {scanCompleted && (
              <IonCard 
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  margin: '1.5rem 0'
                }}
              >
                <IonItem lines="none" style={{ '--background': 'var(--ion-color-light)' }}>
                  <IonLabel className="ion-text-wrap">
                    <IonText color="medium">
                      <h3 style={{ 
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        marginBottom: '0.5rem'
                      }}>
                        Transmitted Payload
                      </h3>
                    </IonText>
                    <div 
                      style={{ 
                        backgroundColor: 'var(--ion-color-light-shade)',
                        borderRadius: '8px',
                        padding: '1rem',
                        wordBreak: 'break-all',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        position: 'relative'
                      }}
                    >
                      {datas || 'No data recorded'}
                      <IonButton 
                        fill="clear"
                        size="small"
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '8px',
                          '--padding-start': '4px',
                          '--padding-end': '4px'
                        }}
                        onClick={() => navigator.clipboard.writeText(datas)}
                      >
                        <IonIcon 
                          icon={documentOutline} 
                          color="medium" 
                          style={{ fontSize: '18px' }}
                        />
                      </IonButton>
                    </div>
                  </IonLabel>
                </IonItem>
              </IonCard>
            )}

            {/* stop session button */}
            <Button onClick={stopEmulation} variant={"outline"} className='my-custom-button outline'>Stop Session</Button>
         
          </div>
        </BottomSheet>
      )}
    </IonPage>
  );
};

export default Home;