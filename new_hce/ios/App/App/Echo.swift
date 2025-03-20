import Foundation
import Capacitor
import CoreNFC

@objc(IosEmulator) 
public class IosEmulator: CAPPlugin {

    @available(iOS 17.4, *)
    @objc func StartEmulation(_ call: CAPPluginCall) {
        let stringData = call.getString("Data") ?? "Error Reading Data"
        let utf8Data = Data(stringData.utf8) // Ensure UTF-8 encoding
        let payloadLength = utf8Data.count + 3
        let ndefMessage: [UInt8] = [
            0xD1,
            0x01,
            UInt8(payloadLength),
            0x54,
            0x02,
            0x65, 0x6E
        ] + [UInt8](utf8Data)                   // The actual text content

        let ndefMessageLength = UInt16(ndefMessage.count)
        let ndefFile: [UInt8] = [
            UInt8((ndefMessageLength >> 8) & 0xFF),
            UInt8(ndefMessageLength & 0xFF)
        ] + ndefMessage

        var selectedFile: UInt16? = nil
        var hasCompletedNdefRead = false

        // APDU Processing Function
        let processAPDU: (_: Data) -> (Data, Bool) = { capdu in
            print("Processing APDU:", capdu.map { String(format: "%02X", $0) }.joined())

            // SELECT AID
            if capdu == Data([0x00, 0xA4, 0x04, 0x00, 0x07, 0xD2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01, 0x00]) {
                print("AID selected")
                return (Data([0x90, 0x00]), false)
            }

            // SELECT CC
            if capdu == Data([0x00, 0xA4, 0x00, 0x0C, 0x02, 0xE1, 0x03]) {
                selectedFile = 0xE102
                print("CC file selected")
                return (Data([0x90, 0x00]), false)
            }

            // READ CC
            if capdu == Data([0x00, 0xB0, 0x00, 0x00, 0x0F]) {
                print("Reading CC file")
                return (Data([
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
                ]), false)
            }

            // SELECT NDEF
            if capdu == Data([0x00, 0xA4, 0x00, 0x0C, 0x02, 0xE1, 0x04]) {
                selectedFile = 0xE103
                print("NDEF file selected")
                return (Data([0x90, 0x00]), false)
            }

            // READ NLEN
            if capdu == Data([0x00, 0xB0, 0x00, 0x00, 0x02]) {
                print("Reading NDEF length")
                return (Data(ndefFile[0..<2]) + Data([0x90, 0x00]), false)
            }

            // READ BINARY
            if capdu.starts(with: [0x00, 0xB0]) {
                guard selectedFile == 0xE103 else {
                    print("Error: No valid file selected before reading")
                    return (Data([0x6A, 0x82]), false)
                }

                let offset = (Int(capdu[2]) << 8) | Int(capdu[3])
                let lengthRequested = capdu.count > 4 ? Int(capdu[4]) : 0

                if lengthRequested == 0 {
                    return (Data([0x90, 0x00]), false)
                }

                if offset >= ndefFile.count {
                    return (Data([0x6A, 0x82]), false)
                }

                let endIndex = min(offset + lengthRequested, ndefFile.count)
                let slice = ndefFile[offset..<endIndex]
                print("Returning NDEF data: \(slice.map { String(format: "%02X", $0) }.joined())")
                
                // Check if this is the last chunk of NDEF data
                let isComplete = endIndex >= ndefFile.count
                return (Data(slice) + Data([0x90, 0x00]), isComplete)
            }

            print("Unknown command")
            return (Data([0x6A, 0x82]), false)
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
            
            do {
                if await cardSession.isEmulationInProgress == false {
                    cardSession.alertMessage = String(localized: "Hold Device Near Reader")
                    try await cardSession.startEmulation()
                    print("Emulation started.")
                }
            } catch {
                print("Error starting emulation: \(error)")
            }
            
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
                    print("Reader deselected. Stopping emulation.")
                    break
                case .received(let cardAPDU):
                    print("Received APDU: \(cardAPDU.payload.hexEncodedString())")
                    do {
                        let (responseAPDU, isComplete) = processAPDU(cardAPDU.payload)
                        print("Generated response APDU: \(responseAPDU.hexEncodedString())")
                        if !responseAPDU.isEmpty {
                            try await cardAPDU.respond(response: responseAPDU)
                            print("Responding with APDU: \(responseAPDU.hexEncodedString())")
                            
                            if isComplete {
                                print("NDEF data transfer complete, stopping emulation.")
                                await cardSession.stopEmulation(status: .success)
                                
                                cardSession.invalidate()
                            }
                        } else {
                            print("Warning: Empty responseAPDU received")
                        }
                    } catch {
                        print("Error responding to APDU: \(error)")
                    }
                    break
                case .sessionInvalidated:
                    self.notifyListeners("sessionInvalidated", data: ["message": "Session invalidated"])
                            call.resolve()
                    cardSession.invalidate()
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
