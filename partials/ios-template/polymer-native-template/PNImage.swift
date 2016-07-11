//
//  PNImg.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNImage : PNBaseElement {
    
    override func create() {
        self.renderedComponent = UIImageView()
    }
    
    override func update() {
        super.update()
        
        let paddings = PNUtils.edgeInsetsFromProperties(self.properties)
        
        self.renderedComponent.frame.size.width -= paddings.left + paddings.right
        self.renderedComponent.frame.size.height -= paddings.bottom + paddings.top
        
        //Image source
        let src = PNUtils.webPathToAppPath(self.properties["src"] as! String)
        let image = UIImage(named:src)
        (self.renderedComponent as! UIImageView).image = image
    }
}