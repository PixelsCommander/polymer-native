Web Components based native UI framework for mobile
===================================================

No new conceptions. Use HTML/CSS which you know so good to develop completely native applications.

Motivation
----------
Currently mobile devices are amazingly powerful and mobile web applications are fast enough however controls behaviour is different between web and native. Experienced user notice this difference immideately which results in lower user satisfaction for web based apps because they got used to consistant UI behaviour on mobile platform of their choice. This can be solved by creating native facade for natvie components.


Code example
------------

```html

html {
    font-family: 'Helvetica';
    text-align: center;
}

body {
    margin: 20px;
}

#icon {
    display: inline-block;
    margin-bottom: 20px;
}

#submit-input {
    width: 100%;
    height: 40px;
    padding: 10px;
    font-size: 16px;
    margin-bottom:10px;
}

button {
    color: #ffffff;
    width: 100%;
    height: 40px;
    background-color: black;
    text-align: center;
    vertical-align: center;
    display: table-cell;
    line-height: 40px;
    font-size: 16px;
    border: 0;
    padding: 0;
    margin-bottom: 10px;
    border-radius: 5px;
}

<body>
    <img is="native-image" width="256" height="256" id="icon" src="img/lenna.png"></img>
    <input is="native-input" id="submit-input" value="Hello world!"></input>
    <button is="native-button" onclick="alert(document.getElementById('submit-input').value);">Alert input value</button>
</body>
```

Will result in app looking in the same way in browser and on mobile device or emulator but the difference is that in browser all controls are web and on mobile UI is native which leads to higher user satisfaction without additional job done.

Result iOS
-------------
![Polymer Native app sample](https://github.com/PixelsCommander/polymer-native/blob/master/figures/app-screen.png?raw=true)

Result Chrome
-------------
![Polymer Native app sample](https://github.com/PixelsCommander/polymer-native/blob/master/figures/app-screen-browser.png?raw=true)