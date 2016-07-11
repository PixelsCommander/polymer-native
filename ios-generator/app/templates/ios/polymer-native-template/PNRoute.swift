//
//  PNRoute.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNRoute : PNView {
    
    var viewController = UIViewController(nibName: nil, bundle: nil)
    
    override func create() {
        
        //super.create();
        self.renderedComponent = UIView()
        self.viewController.view.addSubview(self.renderedComponent)
    }
    
    override func update() {
        
        super.update()
    
        let title = self.getAttribute("title")
        self.viewController.title = title
        
        var frame:CGRect = PNUtils.rectFromProperties(self.properties)
        frame.origin.y = (self.parentPNView as! PNRouter).contentFrame.origin.y + frame.origin.y
        frame.origin.x = (self.parentPNView as! PNRouter).contentFrame.origin.x + frame.origin.x
        frame.size.height = frame.size.height + (self.parentPNView as! PNRouter).navigationController.navigationBar.frame.size.height
        self.renderedComponent.frame = frame
    }
    
    override func mount() {
        
        self.initializeListeners()
    }
}