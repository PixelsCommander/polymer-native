//
//  PNLabel.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNLabel : PNBaseElement {
    
    override func create() {
        self.renderedComponent = UILabel()
    }
    
    override func update() {
        super.update()
        
        //Title text
        let title = self.properties["text"] as! String
        (self.renderedComponent as! UILabel).text = title
        
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