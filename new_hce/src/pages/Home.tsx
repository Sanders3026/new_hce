import React, { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonButton, IonItem, IonInput, IonText
} from '@ionic/react';
import { useNfc } from '../functions/MyFunctions';
import '../css/style.css';
import Modal from '@/components/AndroidSheet';

const Home: React.FC = () => {
  const { datas, startEmulation, change, started, scanError } = useNfc();
  const [showOverlay, setShowOverlay] = useState(started);


  useEffect(() => {
    if (started) {
      setShowOverlay(true);
    } else {
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [started]);

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ backgroundColor: 'var(--ion-background-)' }}>
        {showOverlay && !scanError && (
          <div className={`nfc-tag-overlay ${!started ? "slide-up" : ""}`}>
            <div className="nfc-tag">
              <img 
                src="/icon_padding.png" 
                alt="NFC Tag" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
        <Modal />
      </IonContent>
    </IonPage>
  );
};

export default Home;
