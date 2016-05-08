//
//  PNElement.swift
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
    
    func initializeListeners() {
        
    }
    
    func updateProperties(properties: NSDictionary) {
        if (properties.count > 0) {
            self.properties = properties
        }
    }
    
    func update() {
        if (self.properties.count != 0) {
            //Frame
            self.renderedComponent.frame = PNUtils.rectFromProperties(self.properties)
            
            //Background color
            self.renderedComponent.backgroundColor = PNUtils.backgroundColorFromProperties(self.properties)
        }
    }
    
    func mount() {
        self.parentView.addSubview(self.renderedComponent)
        self.initializeListeners()
    }
    
    func unmount() {
        self.renderedComponent.removeFromSuperview()
    }
    
    static func getById(id: String) -> PNBaseElement {
        return PNBaseElement.elements[id]!
    }
}