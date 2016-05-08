//
//  PNElement.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import WebKit
import XWebView

class PolymerNative : NSObject {
    
    static var instance : PolymerNative!
    
    var deployView : UIView!
    var rootPNView : PNView!
    
    var containerView : UIView!
    var scrollView : UIScrollView!
    var webview: WKWebView = WKWebView()
    
    init(view : UIView) {
        super.init()
        
        PolymerNative.instance = self
        
        self.deployView = view
        self.rootPNView = PNView(id: "root", properties: nil)
        self.rootPNView.create(self.deployView)
        self.rootPNView.mount()
        
        dispatch_async(dispatch_get_main_queue(), {
            self.initWebView()
        })
    }
    
    func initWebView() {
        self.webview = WKWebView(frame: self.deployView.frame, configuration: WKWebViewConfiguration())
        self.webview.loadPlugin(PolymerNative.instance!, namespace: "polymerNativeHost")
        let root = NSBundle.mainBundle().resourceURL!
        let url = root.URLByAppendingPathComponent("./www/index.html")
        self.webview.loadFileURL(url, allowingReadAccessToURL: root)
        self.webview.hidden = true
        self.webview.userInteractionEnabled = false
        self.deployView.addSubview(self.webview)
    }
    
    func createElement(elementData: AnyObject?) {
        do {
            var parentId = "root"
            let data = (elementData as? String)!.dataUsingEncoding(NSUTF8StringEncoding)
            let propertiesDictionary = try NSJSONSerialization.JSONObjectWithData(data!, options: .AllowFragments) as! NSDictionary
            let elementClass = PNUtils.tagNameToClass((propertiesDictionary)["name"] as! String)
            let element = (elementClass as! PNBaseElement.Type).init(id: propertiesDictionary["id"] as! String, properties: propertiesDictionary)
            
            //Setting up parentId which got from browser
            if (!(propertiesDictionary.objectForKey("parentId") is NSNull)) {
                parentId = propertiesDictionary["parentId"] as! String
            }
            
            dispatch_async(dispatch_get_main_queue(), {
                let parentElement = PNBaseElement.getById(parentId)
                (parentElement as! PNView).mountChild(element)
            })
        } catch {
            print("error serializing JSON: \(error)")
        }
        
    }
    
    func removeElement(id: String) {
        let element:PNBaseElement = PNBaseElement.getById(id)
        dispatch_async(dispatch_get_main_queue(), {
            self.rootPNView.unmountChild(element)
        })
    }
    
    func alert(text: AnyObject?) {
        let title = text as? String
        dispatch_async(dispatch_get_main_queue()) {
            let alert = UIAlertView(title: title, message: nil, delegate: nil, cancelButtonTitle: "OK")
            alert.show()
        }
    }
    
}

