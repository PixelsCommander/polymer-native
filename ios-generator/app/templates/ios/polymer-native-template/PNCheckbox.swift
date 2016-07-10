//
//  PNButton.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import ActionKit

class PNCheckbox : PNInteractiveElement {
    
    override func create() {
        self.renderedComponent = UISwitch()
    }
    
    override func update() {
        super.update()
        
        let attributes = self.properties["attributes"] as! NSDictionary
        let checkedString = attributes["checked"] as! NSString
        let isChecked = checkedString.boolValue
        
        (self.renderedComponent as! UISwitch).setOn(isChecked, animated: false)
    }
    
    override func initializeListeners() {
        super.initializeListeners()
        (self.renderedComponent as! UIControl).addControlEvent(.ValueChanged) { self.changed() }
    }
    
    @objc func changed() {
        PNUtils.callMethodOnDOM(self.id, methodName: "setChecked", argument: String((self.renderedComponent as! UISwitch).on));
    }
}