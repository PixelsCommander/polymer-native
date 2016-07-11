//
//  PNBaseElement.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNInteractiveElement : PNBaseElement {
    override func initializeListeners() {
        super.initializeListeners()
        if (self.renderedComponent is UIControl) {
            (self.renderedComponent as! UIControl).userInteractionEnabled = true
            (self.renderedComponent as! UIControl).addControlEvent(.TouchUpInside) { self.clicked() }
        }
    }
    
    override func update() {
        super.update()
        
        if (self.renderedComponent is UIControl) {
            (self.renderedComponent as! UIControl).enabled = !(self.getAttribute("disabled") == "true")
        }
    }
    
    @objc func clicked() {
        PNUtils.dispatchEventOnDOM(self.id, eventName: "click");
    }
}