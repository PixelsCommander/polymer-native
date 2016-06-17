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

class PNButton : PNBaseElement {
    
    override func create() {
        self.renderedComponent = UIButton(type: UIButtonType.System)
    }
    
    override func update() {
        super.update()
        
        //Border
        (self.renderedComponent as! UIButton).layer.cornerRadius = 5;
        //(self.renderedComponent as! UIButton).clipsToBounds = true;
        
        //Title color
        (self.renderedComponent as! UIButton).setTitleColor(PNUtils.colorFromProperties(self.properties), forState: UIControlState.Normal)
        
        //Title text
        let title = self.properties["text"] as! String
        (self.renderedComponent as! UIButton).setTitle(title, forState: UIControlState.Normal)
        
        //Title font
        let fontSize = PNUtils.fontSizeFromProperties(self.properties)
        (self.renderedComponent as! UIButton).titleLabel?.font = UIFont(name: "HelveticaNeue", size: CGFloat(fontSize))
    }
    
    override func initializeListeners() {
        super.initializeListeners()
        (self.renderedComponent as! UIButton).userInteractionEnabled = true
        (self.renderedComponent as! UIButton).addControlEvent(.TouchUpInside) { self.clicked() }
    }
    
    @objc func clicked() {
        PNUtils.dispatchEventOnDOM(self.id, eventName: "click");
    }
}