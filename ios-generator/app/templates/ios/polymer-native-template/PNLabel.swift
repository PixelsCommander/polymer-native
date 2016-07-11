//
//  PNLabel.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNLabel : PNView {
    
    override func create() {
        self.renderedComponent = UILabel()
    }
    
    override func update() {
        super.update()
        
        let paddings = PNUtils.edgeInsetsFromProperties(self.properties)
        
        self.renderedComponent.frame.origin.x += paddings.left
        self.renderedComponent.frame.origin.y += paddings.top
        
        //Title text
        let attributedString = NSMutableAttributedString(string: self.properties["text"] as! String)
        attributedString.addAttribute(NSKernAttributeName, value: CGFloat(-0.3), range: NSRange(location: 0, length: attributedString.length))
        (self.renderedComponent as! UILabel).attributedText = attributedString
        
        //Aligment
        (self.renderedComponent as! UILabel).textAlignment = PNUtils.textAlignFromProperties(self.properties)
            
        //Color
        (self.renderedComponent as! UILabel).textColor = PNUtils.colorFromProperties(self.properties)
        
        //Font size, font family
        let fontSize = PNUtils.fontSizeFromProperties(self.properties)
        (self.renderedComponent as! UILabel).font = UIFont(name: "HelveticaNeue", size: CGFloat(fontSize))
        
        //Word wrap
        (self.renderedComponent as! UILabel).lineBreakMode = .ByWordWrapping
        (self.renderedComponent as! UILabel).numberOfLines = 0
    }
}