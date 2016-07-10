//
//  PNInput.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import ActionKit

class PNInput : PNInteractiveElement {
    
    var isEmpty: Bool = false
    
    override func create() {
        self.renderedComponent = PNTextField()
    }
    
    override func update() {
        super.update()
        
        //Value text
        let value = self.properties["value"] as! String
        (self.renderedComponent as! PNTextField).text = value
        
        //Aligment
        (self.renderedComponent as! PNTextField).contentHorizontalAlignment = PNUtils.contentAlignFromProperties(self.properties)
        
        //Padding
        (self.renderedComponent as! PNTextField).edgeInsets = PNUtils.edgeInsetsFromProperties(self.properties)
    }
    
    override func initializeListeners() {
        super.initializeListeners();
        (self.renderedComponent as! UIControl).addControlEvent(.EditingChanged) { self.changed() }
        (self.renderedComponent as! UIControl).addControlEvent(.EditingDidBegin) { self.focused() }
        (self.renderedComponent as! UIControl).addControlEvent(.EditingDidEnd) { self.edited() }
    }
    
    override func mount() {
        super.mount()
        self.handlePlacaholder()
    }
    
    func handlePlacaholder () {
        if ((self.renderedComponent as! PNTextField).text!.isEmpty) {
            (self.renderedComponent as! PNTextField).text = self.getAttribute("placeholder")
            (self.renderedComponent as! PNTextField).alpha = 0.75
            self.isEmpty = true
        } else {
            self.isEmpty = false
        }
    }
    
    @objc func changed() {
        PNUtils.callMethodOnDOM(self.id, methodName: "setValue", argument: (self.renderedComponent as! UITextField).text!);
    }
    
    @objc func focused() {
        if (self.isEmpty) {
            (self.renderedComponent as! PNTextField).text = nil
            (self.renderedComponent as! PNTextField).alpha = 1.0
        }
        
        PNUtils.callMethodOnDOM(self.id, methodName: "setFocus");
    }
    
    @objc func edited() {
        self.handlePlacaholder()
    }
}

class PNTextField: UITextField {
    
    var edgeInsets: UIEdgeInsets = UIEdgeInsetsMake(0, 0, 0, 0)
    var placeholderText: String = ""
    
    override func textRectForBounds(bounds: CGRect)-> CGRect {
        let rect: CGRect = super.textRectForBounds(bounds);
        return UIEdgeInsetsInsetRect(rect, self.edgeInsets);
    }
    
    override func editingRectForBounds(bounds: CGRect)-> CGRect {
        let rect: CGRect = super.editingRectForBounds(bounds);
        return UIEdgeInsetsInsetRect(rect, self.edgeInsets);
    }
    
    override func placeholderRectForBounds(bounds: CGRect)-> CGRect {
        let rect: CGRect = super.placeholderRectForBounds(bounds);
        return UIEdgeInsetsInsetRect(rect, self.edgeInsets);
    }
    
    override func clearButtonRectForBounds(bounds: CGRect)-> CGRect {
        let rect: CGRect = super.clearButtonRectForBounds(bounds);
        return UIEdgeInsetsInsetRect(rect, self.edgeInsets);
    }
}