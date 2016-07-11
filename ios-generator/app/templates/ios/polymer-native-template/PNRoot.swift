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
import XWebView

class PNRoot : PNView {
    
    var webView: WKWebView!
    var controller: UIViewController!
    var navBarAdded: Bool = false
    
    //Need to have create method with UIView argument 
    //since root node is going to be created as a child of UIView, not of PNView
    func create(controller: UIViewController) {
        
        self.controller = controller
        self.webView = WKWebView.init(frame: self.controller.view.frame)
        self.webView.contentMode = UIViewContentMode.ScaleToFill
        self.renderedComponent = self.webView.scrollView
        self.webView.loadPlugin(PolymerNative.instance!, namespace: "polymerNativeHost")
        let root = NSBundle.mainBundle().resourceURL!
        let url = root.URLByAppendingPathComponent("./www/index.html")
        self.webView.loadFileURL(url, allowingReadAccessToURL: root)
        self.controller.view.addSubview(self.webView)
    }
    
    func setRootView(view: UIView) {
        self.controller.view.addSubview(view)
        //view.frame = self.webView.frame
        //self.controller.view.bringSubviewToFront(webView)
        //self.webView.removeFromSuperview()
        //view.addSubview(self.webView)
    }
    
    func reflectNavBarHeight(visible: Bool) {
        let NAV_BAR_HEIGHT = 40.0
        
        if (visible && !navBarAdded) {
            webView.scrollView.contentSize.height += CGFloat(NAV_BAR_HEIGHT)
            navBarAdded = true
        } else if (!visible && navBarAdded) {
            webView.scrollView.contentSize.height -= CGFloat(NAV_BAR_HEIGHT)
            navBarAdded = false
        }
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