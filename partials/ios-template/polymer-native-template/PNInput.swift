//
//  PNInput.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNInput : PNInteractiveElement {

    override func create() {
        self.renderedComponent = UITextField()
    }
    
    override func update() {
        super.update()
        
        //Border
        (self.renderedComponent as! UITextField).borderStyle = UITextBorderStyle.Line
        (self.renderedComponent as! UITextField).layer.cornerRadius = 5;
        
        //Value text
        let value = self.properties["value"] as! String
        (self.renderedComponent as! UITextField).text = value
    }
    
    override func initializeListeners() {
        super.initializeListeners();
        (self.renderedComponent as! UIControl).addControlEvent(.EditingChanged) { self.changed() }
    }
    
    @objc func changed() {
        PNUtils.callMethodOnDOM(self.id, methodName: "setValue", argument: (self.renderedComponent as! UITextField).text!);
    }
}