//
//  PNButton.swift
//  <%= name %>
//
//  Created by Denis Radin on 20/03/16.
//  Copyright © 2016 Denis Radin. All rights reserved.
//

import Foundation
import UIKit
import ActionKit

class PNCheckbox : PNInteractiveElement {
    
    override func create() {
        self.renderedComponent = UISwitch()
    }
}