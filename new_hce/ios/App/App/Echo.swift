//
//  Echo.swift
//  App
//
//  Created by Sandijs Berzins on 06/03/2025.
//

import Foundation
import Capacitor

@objc(EchoBack) // Name of the class for bridging with Ionic
public class EchoBack: CAPPlugin {
    
    @objc func sigmaReturn(_ call: CAPPluginCall) {
        if let value = call.getString("value") {
            call.resolve(["value": value])
        } else {
            call.reject("No value was provided")
        }
    }
}
