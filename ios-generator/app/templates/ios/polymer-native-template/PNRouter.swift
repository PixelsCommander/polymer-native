//
//  PNRouter.swift
//  <%= name %>
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
    }
    
    override func update() {
        
        self.contentFrame = PNUtils.rectFromProperties(self.properties)
        
        let fullscreen = (self.properties["attributes"] as! NSDictionary)["fullscreen"] as! String
        
        if (fullscreen != "true") {
            self.contentFrame.origin.x = 0
            self.contentFrame.origin.y = self.navigationController.navigationBar.frame.size.height
            self.contentFrame.size.height += self.navigationController.navigationBar.frame.size.height
            super.update()
        }
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
        
        if (self.viewControllerCount > viewControllers.count) {
            PNUtils.backHistory()
        }
        
        self.viewControllerCount = viewControllers.count;
        
    }
}