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

class PNRoot : PNView {
    
    var webView: WKWebView!
    
    //Need to have create method with UIView argument 
    //since root node is going to be created as a child of UIView, not of PNView
    func create(controller: UIViewController) {
        self.webView = WKWebView()
        self.webView.contentMode = UIViewContentMode.ScaleToFill
        self.renderedComponent = self.webView.scrollView
        controller.view = self.webView
    }
    
    override func resize() {
        //We should not to resize webview scrollbar. It happens automatically based on web content height / width.
    }
    
    override func mount() {
        //Nothing to mount - we are the view of controller
    }
    
    override func update() {
        //Background color
        self.renderedComponent.backgroundColor = PNUtils.backgroundColorFromProperties(self.properties)
    }
}