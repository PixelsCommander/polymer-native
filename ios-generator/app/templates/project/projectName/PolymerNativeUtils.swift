//
//  PolymerNativeUtils.swift
//  <%= name %>
//
//  Created by Denis Radin on 23/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit

class PNUtils: NSObject {
    static func dispatchEventOnDOM(elementId: String, eventName: String, data: NSDictionary = NSDictionary()) {
        let jsCommand = "window.polymerNativeClient.dispatchEvent('" + elementId + "', '" + eventName + "')"
        PolymerNative.instance.webview.evaluateJavaScript(jsCommand, completionHandler: nil)
    }
    
    static func callMethodOnDOM(elementId: String, methodName: String, argument: String) {
        let jsCommand = "window.polymerNativeClient.callMethod('" + elementId + "', '" + methodName + "', '" + argument + "')"
        PolymerNative.instance.webview.evaluateJavaScript(jsCommand, completionHandler: nil)
    }
    
    static func rectFromProperties(properties: NSDictionary) -> CGRect {
        
        let bounds = properties["bounds"] as! NSDictionary
        let left = bounds["left"] as! CGFloat
        let top = bounds["top"] as! CGFloat
        let width = bounds["width"] as! CGFloat
        let height = bounds["height"] as! CGFloat
        
        return CGRectMake(left, top, width, height);
    }
    
    static func backgroundColorFromProperties(properties: NSDictionary) -> UIColor {
        
        let style = properties["style"] as! NSDictionary
        let colorString = style["backgroundColor"] as! String
        let color = UIColor(CSSString: colorString)
        
        return color
    }
    
    static func colorFromProperties(properties: NSDictionary) -> UIColor {
        
        let style = properties["style"] as! NSDictionary
        let colorString = style["color"] as! String
        let color = UIColor(rgbString: colorString)
        
        return color
    }
    
    private static func tagNameToClassName(tagName: NSString) -> NSString {
        return tagName.lowercaseString.camelCasedString
    }
    
    static func tagNameToClass(tagName: NSString) -> NSObject.Type {
        let className = "CN_hello_world." + (PNUtils.tagNameToClassName(tagName) as String)
        let anyobjectype : AnyObject.Type = NSClassFromString(className as String)!
        let nsobjectype : NSObject.Type = anyobjectype as! NSObject.Type
        
        return nsobjectype
    }
}

extension UIColor {
    convenience init(CSSString:String) {
        if CSSString.rangeOfString("rgb") != nil{
            self.init(rgbString: CSSString)
        } else {
            self.init(hexString: CSSString)
        }
    }
    
    convenience init(rgbString:String) {
        
        var r = CGFloat(0);
        var g = CGFloat(0);
        var b = CGFloat(0);
        var a = CGFloat(1);
        
        let component = rgbString.componentsSeparatedByCharactersInSet(NSCharacterSet.decimalDigitCharacterSet().invertedSet)
        let list = component.filter({ $0 != "" })
        
        if let rNum = NSNumberFormatter().numberFromString(list[0]) {
            r = CGFloat(rNum)
        }
        
        if let gNum = NSNumberFormatter().numberFromString(list[1]) {
            g = CGFloat(gNum)
        }
        
        if let bNum = NSNumberFormatter().numberFromString(list[2]) {
            b = CGFloat(bNum)
        }
        
        if (list.count == 4) {
            if let aNum = NSNumberFormatter().numberFromString(list[3]) {
                a = CGFloat(aNum)
            }
        }
        
        self.init(red:r, green:g, blue:b, alpha:a)
    }
    
    convenience init(hexString:String) {
        let hexString:NSString = hexString.stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceAndNewlineCharacterSet())
        let scanner            = NSScanner(string: hexString as String)
        
        if (hexString.hasPrefix("#")) {
            scanner.scanLocation = 1
        }
        
        var color:UInt32 = 0
        scanner.scanHexInt(&color)
        
        let mask = 0x000000FF
        let r = Int(color >> 16) & mask
        let g = Int(color >> 8) & mask
        let b = Int(color) & mask
        
        let red   = CGFloat(r) / 255.0
        let green = CGFloat(g) / 255.0
        let blue  = CGFloat(b) / 255.0
        
        self.init(red:red, green:green, blue:blue, alpha:1)
    }
    
    func toHexString() -> String {
        var r:CGFloat = 0
        var g:CGFloat = 0
        var b:CGFloat = 0
        var a:CGFloat = 0
        
        getRed(&r, green: &g, blue: &b, alpha: &a)
        
        let rgb:Int = (Int)(r*255)<<16 | (Int)(g*255)<<8 | (Int)(b*255)<<0
        
        return NSString(format:"#%06x", rgb) as String
    }
}

extension String {
    var camelCasedString: String {
        let source = self
        if source.characters.contains("-") {
            let firstAndSecond = (source as NSString).uppercaseString.substringToIndex(source.startIndex.advancedBy(2))
            let cammel = NSString(format: "%@", (source as NSString).capitalizedString.stringByReplacingOccurrencesOfString("-", withString: "", options: [], range: nil)) as String
            let rest = String(cammel.characters.dropFirst(2))
            return "\(firstAndSecond)\(rest)"
        } else {
            let first = (source as NSString).uppercaseString.substringToIndex(source.startIndex.advancedBy(1))
            let rest = String(source.characters.dropFirst())
            return "\(first)\(rest)"
        }
    }
}