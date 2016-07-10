//
//  PNView.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import WebKit

class PNView : PNInteractiveElement {

    override func create() {
        self.renderedComponent = UIView()
    }
    
    func resize() {
        var totalHeight:CGFloat = self.renderedComponent.frame.height;
        for view in self.renderedComponent.subviews {            
            if (totalHeight < view.frame.origin.y + view.frame.size.height) {
                totalHeight = view.frame.origin.y + view.frame.size.height;
            }
        }
        
        if (self.renderedComponent is UIScrollView) {
            (self.renderedComponent as! UIScrollView).contentSize.height = totalHeight
        } else {
            self.renderedComponent.frame.size.height = totalHeight
        }
        
        //print("Resized " + (self.properties["tagName"] as! String) + " " + totalHeight.description)
        
        if (self.parentPNView != nil) {
            (self.parentPNView as! PNView).resize()
        }
    }
    
    func mountChild(element: PNBaseElement) {
        element.parentPNView = self
        element.parentView = element.parentPNView.renderedComponent
        element.create()
        element.update()
        element.mount()
        self.resize()
    }
    
    func unmountChild(element: PNBaseElement) {
        element.unmount()
        self.resize()
    }
}