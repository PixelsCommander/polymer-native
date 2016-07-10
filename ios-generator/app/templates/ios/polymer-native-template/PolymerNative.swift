//
//  PNElement.swift
//  <%= name %>
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
    
    var rootController : UIViewController!
    var rootView : UIView!
    var rootPNView : PNRoot!
    var webview: WKWebView = WKWebView()
    
    init(controller : UIViewController) {
        super.init()
        
        PolymerNative.instance = self
        
        self.rootController = controller
        self.rootView = controller.view
        self.rootPNView = PNRoot(id: "root", properties: nil)
        self.rootPNView.create(controller)
        
        self.webview = self.rootPNView.webView as WKWebView
    }
    
    func createElement(elementData: AnyObject?) {
        do {
            //By default parentId == root which is self.rootPNView.renderedComponent
            var parentId = "root"
            let data = (elementData as? String)!.dataUsingEncoding(NSUTF8StringEncoding)
            let propertiesDictionary = try NSJSONSerialization.JSONObjectWithData(data!, options: .AllowFragments) as! NSDictionary
            let elementClass = PNUtils.tagNameToClass((propertiesDictionary)["tagName"] as! String)
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
    
    func updateElement(elementData: AnyObject?) {
        do {
            let data = (elementData as? String)!.dataUsingEncoding(NSUTF8StringEncoding)
            let propertiesDictionary = try NSJSONSerialization.JSONObjectWithData(data!, options: .AllowFragments) as! NSDictionary
            let element:PNBaseElement = PNBaseElement.getById(propertiesDictionary["id"] as! String)
            
            dispatch_async(dispatch_get_main_queue(), {
                element.updateProperties(propertiesDictionary)
                element.update()
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
    
    func activateRoute(id: String) {
        
        dispatch_async(dispatch_get_main_queue()) {
            let element:PNRoute = PNBaseElement.getById(id) as! PNRoute
            element.renderedComponent.hidden = false
            
            let navigationController = (element.parentPNView as! PNRouter).navigationController
            let isFirstInStack = (element.parentPNView as! PNRouter).navigationController.viewControllers.count == 0
            let hideFirstBar = (element.parentPNView as! PNRouter).getAttribute("hidefirstbar") == "true"
            
            if (navigationController.viewControllers.count > 1 && navigationController.viewControllers[navigationController.viewControllers.count - 2] == element.viewController) {
                //If going back from JS
                navigationController.popViewControllerAnimated(true)
            } else {
                //Otherwise push
                navigationController.pushViewController(element.viewController, animated: !isFirstInStack)
                navigationController.navigationBarHidden = isFirstInStack && hideFirstBar
            }
        }
    }
    
    func alert(text: AnyObject?) {
        let title = text as? String
        dispatch_async(dispatch_get_main_queue()) {
            let alert = UIAlertView(title: title, message: nil, delegate: nil, cancelButtonTitle: "OK")
            alert.show()
        }
    }
    
    func log(text: AnyObject?) {
        let title = text as! String
        print("Log: " + title)
    }
    
}

