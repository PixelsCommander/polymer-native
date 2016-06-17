![Polymer Native](https://github.com/PixelsCommander/polymer-native/blob/master/figures/logo.png?raw=true)

Native UI framework based on Web Components
===========================================

[![Join the chat at https://gitter.im/PixelsCommander/polymer-native](https://badges.gitter.im/PixelsCommander/polymer-native.svg)](https://gitter.im/PixelsCommander/polymer-native?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Want to have superpowers of React Native without knowing all the React, Flux, Redux, Webpack? Here you go. Feel free to use HTML/CSS which you know so good and VanillaJS with any framework on top of it to develop completely native applications for mobile platforms.

Motivation
----------
Currently mobile devices are powerful enough to run mobile web applications at 60 FPS however controls behavior (buttons, sliders, form elements) is different between web and native platforms. Experienced user notice this difference immediately which results in lower user satisfaction for web based apps because they got used to consistent UI behavior on mobile platform of their choice. Creating native facades for web components results in better user experience without additional effort or knowledge needed.

Example app index.html
----------------------

```html

<style>
    body {
        margin: 20px;
    }

    #icon {
        display: inline-block;
        margin-bottom: 20px;
    }

    #submit-input {
        width: 100%;
    }

    button {
        margin-bottom: 10px;
        width: 100%;
    }

    #blue-view, #red-view {
        width: 100%;
        height: 200px;
    }

    #blue-div {
        background-color: blue;
    }

    #big-div {
        background-color: red;
    }
</style>

<body>
    <img is="native-image" width="256" height="256" id="icon" src="img/lenna.png"></img>
    <input is="native-input" id="submit-input" value="Hello world!"></input>
    <button is="native-button" onclick="alert(document.getElementById('submit-input').value);">Alert input value</button>
</body>
```

Will result in app looking in the same way in browser and on mobile device or emulator but the difference is that in browser all controls are web and on mobile UI is native which leads to higher user satisfaction without additional job done.

Result iOS (native app)
-------------
![Polymer Native app sample](https://github.com/PixelsCommander/polymer-native/blob/master/figures/app-screen.png?raw=true)

Result Chrome (web app)
-------------
![Polymer Native app sample](https://github.com/PixelsCommander/polymer-native/blob/master/figures/app-screen-browser.png?raw=true)


How to
------

Installing via NPM

```bash
    npm install polymer-native -g
```

Initializing new project

```bash
    polymer-native init MyTestProject
```

Running project on iOS

```bash
    polymer-native run
```

License
-------
MIT: http://mit-license.org/

Copyright 2016 Denis Radin aka [PixelsCommander](http://pixelscommander.com)
