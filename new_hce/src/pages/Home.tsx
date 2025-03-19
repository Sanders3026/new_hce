import React from 'react';
import {
  IonContent, IonPage, 
  IonButton, IonItem, IonInput, IonText
} from '@ionic/react';
import "react-spring-bottom-sheet/dist/style.css";
import { useNfc } from '../functions/MyFunctions';
import '../css/style.css';
import Modal from '@/components/AndroidSheet';
const Home: React.FC = () => {
  const { datas, startEmulation, change, started, scanCompleted, scanError } = useNfc();

 

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

      <Modal></Modal>
    </IonPage>
  );
};

export default Home;