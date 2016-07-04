//
//  PNBaseElement.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNInteractiveElement : PNBaseElement {
    override func initializeListeners() {
        super.initializeListeners()
        (self.renderedComponent as! UIControl).userInteractionEnabled = true
        (self.renderedComponent as! UIControl).addControlEvent(.TouchUpInside) { self.clicked() }
    }
    
    @objc func clicked() {
        PNUtils.dispatchEventOnDOM(self.id, eventName: "click");
    }
}