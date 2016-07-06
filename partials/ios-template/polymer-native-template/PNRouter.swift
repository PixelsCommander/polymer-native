//
//  PNRouter.swift
//  polymer-native-template
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import ActionKit

class PNRouter : PNView, UINavigationControllerDelegate {
    
    var viewController = UIViewController(nibName: nil, bundle: nil)
    var navigationController : UINavigationController = UINavigationController()
    var contentFrame : CGRect!
    var viewControllerCount : Int = 0
    
    override func create() {
        
        self.renderedComponent = self.navigationController.view
        self.navigationController.delegate = self
        //self.navigationController.automaticallyAdjustsScrollViewInsets = false;
    }
    
    override func update() {
        
        self.contentFrame = PNUtils.rectFromProperties(self.properties)
        
        let fullscreen = (self.properties["attributes"] as! NSDictionary)["fullscreen"] as! String
        
        if (fullscreen != "true") {
            
            self.contentFrame.origin.x = 0
            self.contentFrame.origin.y = self.navigationController.navigationBar.frame.size.height
            self.contentFrame.size.height += self.navigationController.navigationBar.frame.size.height
            super.update()
        } else {
            //PolymerNative.instance.rootPNView.renderedComponent.backgroundColor = UIColor.blueColor()
            //self.navigationController.navigationBar.removeFromSuperview()
            //UIApplication.sharedApplication().windows.last?.addSubview(self.navigationController.navigationBar)
        }
        
        self.navigationController.navigationBarHidden = true
    }
    
    override func initializeListeners() {
        
        super.initializeListeners()
    }
    
    override func mount() {

        PolymerNative.instance.rootController.addChildViewController(self.navigationController)
        PolymerNative.instance.rootPNView.renderedComponent.addSubview(self.navigationController.view)
        self.initializeListeners()
    }
    
    func navigationController(navigationController: UINavigationController, willShowViewController viewController: UIViewController, animated: Bool) {
        
        let viewControllers = self.navigationController.viewControllers;
        
        //Means this is a back navigation
        if (self.viewControllerCount > viewControllers.count) {
            PNUtils.backHistory()
            
            //1 Since we performing check before view controller is removed
            let hideFirstBar = self.getAttribute("hideFirstBar") == "true"
            let isFirstInStack = self.navigationController.viewControllers.count == 1
            self.navigationController.navigationBarHidden = isFirstInStack && hideFirstBar
        }
        
        self.viewControllerCount = viewControllers.count;
    }
}