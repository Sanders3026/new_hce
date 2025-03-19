import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    // additional code
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(IosEmulator())
    }
}
