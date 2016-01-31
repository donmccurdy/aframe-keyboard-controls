# A-Frame `keyboard-controls` Component

Keyboard controls for A-Frame.

## Overview

Bindings and events for keyboard controls on an A-Frame VR scene. When combined with [ProxyControls.js](https://github.com/cvan/socketpeer) (with the [proxy-controls](https://github.com/donmccurdy/aframe-proxy-controls) component for A-Frame), can also receive remote keyboard input by WebRTC.

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
