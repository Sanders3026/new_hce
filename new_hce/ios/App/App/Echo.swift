import Foundation
import Capacitor
import CoreNFC

@objc(EchoBack) // Name of the class for bridging with Ionic
public class EchoBack: CAPPlugin {

    @available(iOS 17.4, *)
    @objc func sigmaReturn(_ call: CAPPluginCall) {
        let stringData = call.getString("Data") ?? "Hello from iOS HCE!"
        let utf8Data = Data(stringData.utf8) // Ensure UTF-8 encoding

        // Calculate the actual payload length (text content + language code length + 1 for status byte)
        let payloadLength = utf8Data.count + 3 // 3 = language code (2) + status byte (1)

        // Format the NDEF message according to the NFC Forum Type 2 specification
        let ndefMessage: [UInt8] = [
            0xD1,                               // MB=1, ME=1, CF=0, SR=1, IL=0, TNF=1
            0x01,                               // Record Type Length (1 byte for 'T')
            UInt8(payloadLength),               // Payload Length
            0x54,                               // 'T' (Text Record Type)
            0x02,                               // Status byte (UTF-8, 2-byte language code)
            0x65, 0x6E                          // 'en' language code
        ] + [UInt8](utf8Data)                   // The actual text content

        // Calculate total NDEF message length
        let ndefMessageLength = UInt16(ndefMessage.count)
        let ndefFile: [UInt8] = [
            UInt8((ndefMessageLength >> 8) & 0xFF), // High byte of length
            UInt8(ndefMessageLength & 0xFF)         // Low byte of length
        ] + ndefMessage

        var selectedFile: UInt16? = nil // Keep track of the selected file

        // APDU Processing Function
        let processAPDU: (_: Data) -> Data = { capdu in
            print("Processing APDU:", capdu.map { String(format: "%02X", $0) }.joined())

            // SELECT AID
            if capdu == Data([0x00, 0xA4, 0x04, 0x00, 0x07, 0xD2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01, 0x00]) {
                print("AID selected")
                return Data([0x90, 0x00]) // Success
            }

            // SELECT CC
            if capdu == Data([0x00, 0xA4, 0x00, 0x0C, 0x02, 0xE1, 0x03]) {
                selectedFile = 0xE102
                print("CC file selected")
                return Data([0x90, 0x00]) // Success
            }

            // READ CC
            if capdu == Data([0x00, 0xB0, 0x00, 0x00, 0x0F]) {
                print("Reading CC file")
                return Data([
                    0x00, 0x0F,             // CCLEN: Length of this capability container
                    0x20,                   // Mapping Version 2.0
                    0x00, 0x3B,            // MLe: Maximum data size that can be read using a single ReadBinary command
                    0x00, 0x34,            // MLc: Maximum data size that can be sent using a single UpdateBinary command
                    0x04, 0x06,            // T, L for NDEF File Control TLV
                    0xE1, 0x04,            // File Identifier
                    0x04, 0x00,            // Maximum NDEF file size = 1024 bytes
                    0x00,                  // Read access without any security
                    0x00,                  // Write access without any security
                    0x90, 0x00            // Success
                ])
            }

            // SELECT NDEF
            if capdu == Data([0x00, 0xA4, 0x00, 0x0C, 0x02, 0xE1, 0x04]) {
                selectedFile = 0xE103
                print("NDEF file selected")
                return Data([0x90, 0x00]) // Success
            }

            // READ NLEN
            if capdu == Data([0x00, 0xB0, 0x00, 0x00, 0x02]) {
                print("Reading NDEF length")
                return Data(ndefFile[0..<2]) + Data([0x90, 0x00])
            }

            // READ BINARY
            if capdu.starts(with: [0x00, 0xB0]) {
                guard selectedFile == 0xE103 else {
                    print("Error: No valid file selected before reading")
                    return Data([0x6A, 0x82]) // File not selected
                }

                let offset = (Int(capdu[2]) << 8) | Int(capdu[3])
                let lengthRequested = capdu.count > 4 ? Int(capdu[4]) : 0

                if lengthRequested == 0 {
                    return Data([0x90, 0x00])
                }

                if offset >= ndefFile.count {
                    return Data([0x6A, 0x82])
                }

                let endIndex = min(offset + lengthRequested, ndefFile.count)
                let slice = ndefFile[offset..<endIndex]
                print("Returning NDEF data: \(slice.map { String(format: "%02X", $0) }.joined())")
                return Data(slice) + Data([0x90, 0x00])
            }

            print("Unknown command")
            return Data([0x6A, 0x82])
        }
        Task {
            guard NFCReaderSession.readingAvailable else {
                print("NFC is not available.")
                return
            }
            let cardSession: CardSession
            do {
                cardSession = try await CardSession()
                print("Card session acquired.")
            } catch {
                print("Failed to acquire NFC presentment intent assertion or card session: \(error)")
                return
            }
            // Start NFC Emulation if not already in progress
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
                    await cardSession.stopEmulation(status: .success)
                    cardSession.invalidate()
                    print("Reader deselected. Stopping emulation.")
                    break
                case .received(let cardAPDU):
                    print("Received APDU: \(cardAPDU.payload.hexEncodedString())")
                    do {
                        // Generate the response for the received APDU
                        let responseAPDU = processAPDU(cardAPDU.payload)
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
                case .sessionInvalidated(let reason):
                    print("Session invalidated.")
                    break
                }
            }
        }
    }
}
extension Data {
    func hexEncodedString() -> String {
        return self.map { String(format: "%02X", $0) }.joined()
    }
}
