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

class PNView : PNBaseElement {

    override func create() {
        self.renderedComponent = UIScrollView()
    }
    
    func resize() {
        var totalHeight:CGFloat = 0.0;
        for view in self.renderedComponent.subviews {
            if (totalHeight < view.frame.origin.y + view.frame.size.height) {
                totalHeight = view.frame.origin.y + view.frame.size.height;
            }
        }
        
        totalHeight = 2000;
        
        if (self.renderedComponent is UIScrollView) {
                (self.renderedComponent as! UIScrollView).contentSize.height = totalHeight
        }
        
        if (self.renderedComponent is UIView) {
            self.renderedComponent.frame.size.height = totalHeight
        }
    }
    
    func mountChild(element: PNBaseElement) {
        element.parentPNView = self
        element.parentView = element.parentPNView.renderedComponent
        element.create()
        element.update()
        element.mount()
    }
    
    func unmountChild(element: PNBaseElement) {
        element.unmount()
        self.resize()
    }
}