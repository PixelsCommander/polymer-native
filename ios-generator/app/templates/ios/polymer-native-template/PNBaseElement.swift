//
//  PNBaseElement.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNBaseElement : NSObject {
    
    var id: String = ""
    var properties: NSDictionary = NSDictionary()
    var style: NSDictionary = NSDictionary()
    var parentId: Int8 = 0
    var parentView : UIView!
    var parentPNView : PNBaseElement!
    var renderedComponent: UIView = UIView()
    
    static var elements: Dictionary<String, PNBaseElement> = Dictionary()
    
    required init(id: String, properties : NSDictionary?) {
        super.init()
        self.id = id
        if (properties != nil) {
            self.updateProperties(properties!)
        }
        PNBaseElement.elements[id] = self
    }
    
    func create() {
        
    }
    
    func updateProperties(properties: NSDictionary) {
        if (properties.count > 0) {
            self.properties = properties
            
            if (self.properties["style"] != nil) {
                self.style = self.properties["style"] as! NSDictionary
            }
        }
    }
    
    func update() {
        if (self.properties.count != 0) {
            
            //Frame
            self.renderedComponent.frame = PNUtils.rectFromProperties(self.properties)
            
            //Background color
            self.renderedComponent.backgroundColor = PNUtils.backgroundColorFromProperties(self.properties)
            
            //Display
            //self.renderedComponent.hidden = !PNUtils.visibilityFromProperties(self.properties)
            
            //Border
            self.renderedComponent.layer.borderWidth = CGFloat(PNUtils.sizeFromCSSProperty(self.style["borderWidth"] as! String))
            self.renderedComponent.layer.borderColor = PNUtils.colorFromCSSProperty(self.style["borderColor"] as! String).CGColor
            self.renderedComponent.layer.cornerRadius = CGFloat(PNUtils.sizeFromCSSProperty(self.style["borderRadius"] as! String))
        }
        
        if (self.parentPNView != nil) {
            (self.parentPNView as! PNView).resize()
        }
    }
    
    func initializeListeners() {
        
    }
    
    func mount() {
        self.parentView.addSubview(self.renderedComponent)
        self.initializeListeners()
    }
    
    func unmount() {
        self.renderedComponent.removeFromSuperview()
    }
    
    func getStyle(name: String)-> String {
        let value = (self.properties["style"] as! NSDictionary)[name]
        
        if (value != nil) {
            return value as! String
        } else {
            return ""
        }
    }
    
    func getAttribute(name: String)-> String {
        let value = (self.properties["attributes"] as! NSDictionary)[name]
        
        if (value != nil) {
            return value as! String
        } else {
            return ""
        }
    }
    
    static func getById(id: String) -> PNBaseElement {
        return PNBaseElement.elements[id]!
    }
}