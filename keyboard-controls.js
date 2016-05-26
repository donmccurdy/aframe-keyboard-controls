require('./lib/keyboard.polyfill');

var MAX_DELTA = 200,
    PROXY_FLAG = '__keyboard-controls-proxy';

var KeyboardEvent = window.KeyboardEvent;

/**
 * Keyboard Controls component.
 *
 * Bind keyboard events to components, or control your entities with the WASD keys.
 *
 * @namespace wasd-controls
 * @param {number} [easing=20] - How fast the movement decelerates. If you hold the
 * keys the entity moves and if you release it will stop. Easing simulates friction.
 * @param {number} [acceleration=65] - Determines the acceleration given
 * to the entity when pressing the keys.
 * @param {bool} [enabled=true] - To completely enable or disable the controls
 * @param {bool} [fly=false] - Determines if the direction of the movement sticks
 * to the plane where the entity started off or if there are 6 degrees of
 * freedom as a diver underwater or a plane flying.
 * @param {string} [rollAxis='z'] - The front-to-back axis.
 * @param {string} [pitchAxis='x'] - The left-to-right axis.
 * @param {string} [yawAxis='y'] - The down-to-up axis.
 * @param {bool} [rollAxisInverted=false] - Roll axis is inverted
 * @param {bool} [pitchAxisInverted=false] - Pitch axis is inverted
 * @param {bool} [yawAxisInverted=false] - Pitch axis is inverted
 */
module.exports = {
  schema: {
    easing:            { default: 20 },
    acceleration:      { default: 65 },
    enabled:           { default: true },
    fly:               { default: false },
    rollAxis:          { default: 'z', oneOf: [ 'x', 'y', 'z' ] },
    pitchAxis:         { default: 'x', oneOf: [ 'x', 'y', 'z' ] },
    yawAxis:           { default: 'y', oneOf: [ 'x', 'y', 'z' ] },
    rollAxisInverted:  { default: false },
    rollAxisEnabled:   { default: true },
    pitchAxisInverted: { default: false },
    pitchAxisEnabled:  { default: true },
    yawAxisInverted:   { default: false },
    yawAxisEnabled:    { default: true },
    debug:             { default: false }
  },

  init: function () {
    this.velocity = new THREE.Vector3();
    this.localKeys = {};
    this.listeners = {
      keydown: this.onKeyDown.bind(this),
      keyup: this.onKeyUp.bind(this),
      blur: this.onBlur.bind(this)
    };
    this.attachEventListeners();
  },

  /*******************************************************************
  * Movement
  */

  tick: function (t, dt) {
    var data = this.data;
    var acceleration = data.acceleration;
    var easing = data.easing;
    var velocity = this.velocity;
    var keys = this.getKeys();
    var movementVector;
    var pitchAxis = data.pitchAxis;
    var rollAxis = data.rollAxis;
    var yawAxis = data.yawAxis;
    var pitchSign = data.pitchAxisInverted ? -1 : 1;
    var rollSign = data.rollAxisInverted ? -1 : 1;
    var yawSign = data.yawAxisInverted ? -1 : 1;
    var el = this.el;

    // If data changed or FPS too low, reset velocity.
    if (isNaN(dt) || dt > MAX_DELTA) {
      velocity[pitchAxis] = 0;
      velocity[rollAxis] = 0;
      velocity[yawAxis] = 0;
      return;
    }

    velocity[pitchAxis] -= velocity[pitchAxis] * easing * dt / 1000;
    velocity[rollAxis] -= velocity[rollAxis] * easing * dt / 1000;
    velocity[yawAxis] -= velocity[yawAxis] * easing * dt / 1000;

    var position = el.getComputedAttribute('position');

    if (data.enabled) {
      if (data.pitchAxisEnabled) {
        if (keys.KeyA || keys.ArrowLeft)  {
          velocity[pitchAxis] -= pitchSign * acceleration * dt / 1000;
        }
        if (keys.KeyD || keys.ArrowRight) {
          velocity[pitchAxis] += pitchSign * acceleration * dt / 1000;
        }
      }
      if (data.rollAxisEnabled) {
        if (keys.KeyW || keys.ArrowUp)   {
          velocity[rollAxis] -= rollSign * acceleration * dt / 1000;
        }
        if (keys.KeyS || keys.ArrowDown) {
          velocity[rollAxis] += rollSign * acceleration * dt / 1000;
        }
      }
      if (data.yawAxisEnabled) {
        if (keys.KeyE)   {
          velocity[yawAxis] -= yawSign * acceleration * dt / 1000;
        }
        if (keys.KeyQ) {
          velocity[yawAxis] += yawSign * acceleration * dt / 1000;
        }
      }
    }

    movementVector = this.getMovementVector(dt);
    el.object3D.translateX(movementVector.x);
    el.object3D.translateY(movementVector.y);
    el.object3D.translateZ(movementVector.z);

    el.setAttribute('position', {
      x: position.x + movementVector.x,
      y: position.y + movementVector.y,
      z: position.z + movementVector.z
    });
  },

  getMovementVector: (function () {
    var direction = new THREE.Vector3(0, 0, 0);
    var rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    return function (dt) {
      var velocity = this.velocity;
      var elRotation = this.el.getAttribute('rotation');
      direction.copy(velocity);
      direction.multiplyScalar(dt / 1000);
      if (!elRotation) { return direction; }
      if (!this.data.fly) { elRotation.x = 0; }
      rotation.set(THREE.Math.degToRad(elRotation.x),
                   THREE.Math.degToRad(elRotation.y), 0);
      direction.applyEuler(rotation);
      return direction;
    };
  })(),

  /*******************************************************************
  * Events
  */

  play: function () {
    this.attachEventListeners();
  },

  pause: function () {
    this.removeEventListeners();
  },

  remove: function () {
    this.pause();
  },

  attachEventListeners: function () {
    window.addEventListener('keydown', this.listeners.keydown, false);
    window.addEventListener('keyup', this.listeners.keyup, false);
    window.addEventListener('blur', this.listeners.blur, false);
  },

  removeEventListeners: function () {
    window.removeEventListener('keydown', this.listeners.keydown);
    window.removeEventListener('keyup', this.listeners.keyup);
    window.removeEventListener('blur', this.listeners.blur);
  },

  onKeyDown: function (event) {
    this.localKeys[event.code] = true;
    this.emit(event);
  },

  onKeyUp: function (event) {
    delete this.localKeys[event.code];
    this.emit(event);
  },

  onBlur: function () {
    for (var code in this.localKeys) {
      if (this.localKeys.hasOwnProperty(code)) {
        delete this.localKeys[code];
      }
    }
  },

  emit: function (event) {
    // TODO - keydown only initially?
    // TODO - where the f is the spacebar

    // Emit original event.
    if (PROXY_FLAG in event) {
      // TODO - Method never triggered.
      this.el.emit(event.type, event);
    }

    // Emit convenience event, identifying key.
    this.el.emit(event.type + ':' + event.code, new KeyboardEvent(event.type, event));
    if (this.data.debug) console.log(event.type + ':' + event.code);
  },

  /*******************************************************************
  * Accessors
  */

  isPressed: function (code) {
    return code in this.getKeys();
  },

  getKeys: function () {
    if (this.isProxied()) {
      return this.el.sceneEl.components['proxy-controls'].getKeyboard();
    }
    return this.localKeys;
  },

  isProxied: function () {
    var proxyControls = this.el.sceneEl.components['proxy-controls'];
    return proxyControls && proxyControls.isConnected();
  }

};
