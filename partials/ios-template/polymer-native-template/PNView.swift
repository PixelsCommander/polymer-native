//
//  PNElement.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNView : PNBaseElement {
    
    override func create() {
        self.create(nil)
    }
    
    //Need to have create with UIView argument here since root node is going to be created on UIView, not on PNView
    func create(parentView: UIView?=nil) {
        self.renderedComponent = UIScrollView()
        
        if (parentView != nil) {
            self.parentView = parentView
            self.renderedComponent.frame = parentView!.bounds
            (self.renderedComponent as! UIScrollView).contentSize = parentView!.bounds.size
        }
    }
    
    func resize() {
        var totalHeight:CGFloat = 0.0;
        for view in self.renderedComponent.subviews {
            if (totalHeight < view.frame.origin.y + view.frame.size.height) {
                totalHeight = view.frame.origin.y + view.frame.size.height;
            }
        }
        
        (self.renderedComponent as! UIScrollView).contentSize.height = totalHeight
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