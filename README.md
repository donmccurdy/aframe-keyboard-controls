# A-Frame `keyboard-controls` Component

Keyboard controls for A-Frame.

## Overview

Bindings and events for keyboard controls on an A-Frame VR scene. When combined with [ProxyControls.js](https://proxy-controls.donmccurdy.com) (with the [proxy-controls](https://github.com/donmccurdy/aframe-proxy-controls) component for A-Frame), can also receive remote keyboard input by WebRTC.

## Usage

Movement + keyboard events:

```html
<a-scene>
  <a-entity camera
            keyboard-controls>
  </a-entity>
</a-scene>
```

Keyboard events only (no movement):

```html
<a-scene>
  <a-entity camera
            keyboard-controls="enabled: false">
  </a-entity>
</a-scene>
```

The full list of options can be seen in
[`keyboard-controls.js`](keyboard-controls.js).

## Usage + Remote Device

[ProxyControls.js ⇢ Docs](http://localhost:3000/#/docs#remote-device)

Example:

```html
<a-scene proxy-controls>
  <a-entity camera
            keyboard-controls>
  </a-entity>
</a-scene>
```

## Check Keyboard State

To check the pressed/unpressed state of a given [Keyboard.code](https://w3c.github.io/uievents-code/#code-value-tables), use the `isPressed()` method:

```javascript
var keyboardControls = el.components['keyboard-controls'];
keyboardControls.isPressed('ArrowLeft');
```

## Events

`keyboard-controls` comes with a polyfill guaranteeing support for [KeyboardEvent.key](https://www.w3.org/TR/DOM-Level-3-Events-key/) and [KeyboardEvent.code](https://w3c.github.io/uievents-code/). When a `keydown` or `keyup` event is detected, an extra event is created with the `code` attached. Example usage:

```html
<a-entity keyboard-controls
          sound="src: reload.wav;
                 on: keydown:KeyR">
</a-entity>
```

A complete list of `code` values may be found [here](https://w3c.github.io/uievents-code/#code-value-tables).

## Known Issues

In OS X, pressing the Command/Meta (⌘) key blocks all other key events. For example, pressing `A`, pressing `⌘`, releasing `A`, and then releasing `⌘` would create a `keydown:KeyA` event, but no `keyup:KeyA`. Because of this, I do not recommend using the Command/Meta key in your apps.
