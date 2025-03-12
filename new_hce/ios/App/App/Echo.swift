
import Foundation
import Capacitor
import CoreNFC

@objc(EchoBack) // Name of the class for bridging with Ionic
public class EchoBack: CAPPlugin {
    
    @available(iOS 17.4, *)
    @objc func sigmaReturn(_ call: CAPPluginCall) {
        /// A place-holder function for APDU processing. In a real app,
        /// process the received data and return a response as Data.
        
        let stringData = call.getString("Data") ?? "No message provided"
        print("Received string data from Ionic: \(stringData)")
        let utf8Data = Data(stringData.utf8)
        
        // APDU Processing function
        let ProcessAPDU: (_: Data) -> Data = { capdu in
            print("Processing APDU:", capdu.map { String(format: "%02X", $0) }.joined())

            // AID selection command (SELECT AID)
            if capdu.starts(with: [0x00, 0xA4, 0x04, 0x00]) {
                print("AID selected, responding with FCI and 9000")
                return Data([0x6F, 0x10, 0x84, 0x08] + [0xD2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01, 0x00] + [0x90, 0x00])
            }

            // Read Binary command - return an NDEF message
            if capdu.starts(with: [0x00, 0xB0, 0x00, 0x00]) {
                print("Reading NDEF message...")

                let ndefMessage: [UInt8] = [
                    0xD1, 0x01, 0x0B,  // NDEF header: Well-known, short record
                    0x54,              // Type: 'T' (Text record)
                    0x02,              // Length of language code
                    0x65, 0x6E,        // Language code: "en"
                ] + utf8Data.map { UInt8($0) } + [0x90, 0x00] // Add the UTF-8 encoded string and success status
                
                return Data(ndefMessage)
            }

            // Default response if APDU is unknown
            return Data([0x6A, 0x82]) // File not found error
        }
        
        Task {
            guard NFCReaderSession.readingAvailable,
                  CardSession.isSupported,
                  await CardSession.isEligible else {
                print("NFC is not available or not eligible for use.")
                return
            }
            
            // Hold a presentment intent assertion reference to prevent the
            // default contactless app from launching. In a real app, monitor
            // presentmentIntent.isValid to ensure the assertion remains active.
            var presentmentIntent: NFCPresentmentIntentAssertion?
            
            let cardSession: CardSession
            do {
                presentmentIntent = try await NFCPresentmentIntentAssertion.acquire()
                cardSession = try await CardSession()
                print("Card session acquired.")
            } catch {
                print("Failed to acquire NFC presentment intent assertion or card session: \(error)")
                return
            }
            
            // Check if emulation is not already in progress and start it
            do {
                if await cardSession.isEmulationInProgress == false {
                    cardSession.alertMessage = String(localized: "Hold Device Near Reader")
                    try await cardSession.startEmulation()
                    print("Emulation started.")
                }
            } catch {
                print("Error starting emulation: \(error)")
            }
            
            // Listen for NFC events
            for try await event in cardSession.eventStream {
                switch event {
                case .sessionStarted:
                    print("Session started.")
                    break
                
                case .readerDetected:
                    print("Reader detected.")
                    break
                
                case .readerDeselected:
                    print("Reader deselected. Stopping emulation.")
                    await cardSession.stopEmulation(status: .success)
                    break
                
                case .received(let cardAPDU):
                    print("Received APDU: \(cardAPDU.payload.hexEncodedString())")
                    
                    do {
                        // Generate the response for the received APDU
                        let responseAPDU = ProcessAPDU(cardAPDU.payload)
                        print("Generated response APDU: \(responseAPDU.hexEncodedString())")
                        
                        // Ensure the response is not empty before sending
                        if !responseAPDU.isEmpty {
                            try await cardAPDU.respond(response: responseAPDU)
                            print("Responding with APDU: \(responseAPDU.hexEncodedString())")
                        } else {
                            print("Warning: Empty responseAPDU received")
                        }
                    } catch {
                        print("Error responding to APDU: \(error)")
                    }
                    break
                    
                case .sessionInvalidated(reason: _):
                    // The NFC session ended
                    print("Session invalidated.")
                    // Perform cleanup or reset UI here
                    break
                }
            }
            
            // Release presentment intent assertion
            presentmentIntent = nil
        }
    }
}

extension Data {
    func hexEncodedString() -> String {
        return self.map { String(format: "%02hhx", $0) }.joined()
    }
}
