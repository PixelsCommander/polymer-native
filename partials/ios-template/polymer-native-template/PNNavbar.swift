//
//  PNButton.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import ActionKit

class PNNavbar : PNView {
    
    override func create() {
        self.renderedComponent = (self.parentPNView as! PNRouter).navigationController.navigationBar
    }
    
    override func update() {
        super.update()
        
        //Background color
        (self.renderedComponent as! UINavigationBar).barTintColor = PNUtils.backgroundColorFromProperties(self.properties)
        
        //Title color and size
        let fontColor = PNUtils.colorFromProperties(self.properties)
        let fontSize = CGFloat(PNUtils.fontSizeFromProperties(self.properties))
        
        let navbarFont = UIFont(name: "Ubuntu", size: fontSize) ?? UIFont.systemFontOfSize(fontSize)
        (self.renderedComponent as! UINavigationBar).titleTextAttributes = [NSFontAttributeName: navbarFont, NSForegroundColorAttributeName : fontColor]
        
        //Back button color and size
        let barbuttonFont = UIFont(name: "Ubuntu-Light", size: fontSize) ?? UIFont.systemFontOfSize(fontSize)
        (self.renderedComponent as! UINavigationBar).tintColor = fontColor
        (self.renderedComponent as! UINavigationBar).backItem?.backBarButtonItem?.setTitleTextAttributes([NSFontAttributeName: barbuttonFont, NSForegroundColorAttributeName:fontColor], forState: UIControlState.Normal)
    }
}