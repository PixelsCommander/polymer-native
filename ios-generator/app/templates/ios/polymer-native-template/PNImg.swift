//
//  PNImg.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNImg : PNBaseElement {
    
    override func create() {
        self.renderedComponent = UIImageView()
    }
    
    override func update() {
        super.update()
        
        //Image source
        let src = PNUtils.webPathToAppPath(self.properties["src"] as! String)
        let image = UIImage(named:src)
        (self.renderedComponent as! UIImageView).image = image
    }
}