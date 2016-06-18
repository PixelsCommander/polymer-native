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
    
    static var APP_FILES_PATH = "./www/";
    
    static func backHistory() {
        
        let jsCommand = "window.polymerNativeClient.back()"
        PolymerNative.instance.webview.evaluateJavaScript(jsCommand, completionHandler: nil)
    }
    
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
    
    static func visibilityFromProperties(properties: NSDictionary) -> Bool {
        let style = properties["style"] as! NSDictionary
        let displayString = style["display"] as! String
        let visibilityString = style["visibility"] as! String
        
        if (displayString != "none" && visibilityString != "hidden") {
            return true
        }
        
        return false
    }
    
    static func backgroundColorFromProperties(properties: NSDictionary) -> UIColor {
        
        let style = properties["style"] as! NSDictionary
        let colorString = style["backgroundColor"] as! String
        
        let backgroundImage = style["backgroundImage"] as? String
        
        if (backgroundImage != nil) {
            return PNUtils.colorFromCSSProperty(colorString)
            //return UIColor(patternImage: UIImage(named: backgroundImage!)!)
        } else {
            return PNUtils.colorFromCSSProperty(colorString)
        }
    }
    
    static func colorFromProperties(properties: NSDictionary) -> UIColor {
        
        let style = properties["style"] as! NSDictionary
        let colorString = style["color"] as! String
        
        return PNUtils.colorFromCSSProperty(colorString)
    }
    
    static func colorFromCSSProperty(propertyValue: String) -> UIColor {
        return UIColor(CSSString: propertyValue)
    }
    
    static func sizeFromCSSProperty(propertyValue: String) -> Float {
        
        let propertyValue = propertyValue.stringByReplacingOccurrencesOfString("px", withString: "")
        return (NSNumberFormatter().numberFromString(propertyValue)?.floatValue)!
    }
    
    static func fontSizeFromProperties(properties: NSDictionary) -> Float {
        
        let style = properties["style"] as! NSDictionary
        let fontSizeString = (style["fontSize"] as! String)
        
        return PNUtils.sizeFromCSSProperty(fontSizeString)
    }
    
    private static func tagNameToClassName(tagName: NSString) -> String {
        
        return tagName.lowercaseString.stringByReplacingOccurrencesOfString("native", withString: "pn", options: NSStringCompareOptions.LiteralSearch, range: nil).camelCasedString

    }
    
    static func tagNameToClass(tagName: NSString) -> NSObject.Type {
        
        var bundleName: String = NSBundle.mainBundle().infoDictionary!["CFBundleName"] as! String
        bundleName = bundleName.stringByReplacingOccurrencesOfString("-", withString: "_", options: NSStringCompareOptions.LiteralSearch, range: nil)
        
        let className = bundleName + "." + (PNUtils.tagNameToClassName(tagName) as String)
        let anyobjectype : AnyObject.Type = NSClassFromString(className as String)!
        let nsobjectype : NSObject.Type = anyobjectype as! NSObject.Type
        
        return nsobjectype
    }
    
    static func webPathToAppPath(filePath: String) -> String {
        return APP_FILES_PATH + filePath;
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
            r = CGFloat(rNum) / 255.0
        }
        
        if let gNum = NSNumberFormatter().numberFromString(list[1]) {
            g = CGFloat(gNum) / 255.0
        }
        
        if let bNum = NSNumberFormatter().numberFromString(list[2]) {
            b = CGFloat(bNum) / 255.0
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