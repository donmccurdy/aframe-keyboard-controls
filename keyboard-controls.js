require('keyboardevent-key-polyfill').polyfill();

var MAX_DELTA = 0.2,
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
 * @param {bool} [rollAxisInverted=false] - Roll axis is inverted
 * @param {bool} [pitchAxisInverted=false] - Pitch axis is inverted
 */
module.exports = {
  schema: {
    easing:            { default: 20 },
    acceleration:      { default: 65 },
    enabled:           { default: true },
    fly:               { default: false },
    rollAxis:          { default: 'z', oneOf: [ 'x', 'y', 'z' ] },
    pitchAxis:         { default: 'x', oneOf: [ 'x', 'y', 'z' ] },
    rollAxisInverted:  { default: false },
    rollAxisEnabled:   { default: true },
    pitchAxisInverted: { default: false },
    pitchAxisEnabled:  { default: true }
  },

  init: function () {
    this.velocity = new THREE.Vector3();
    this.localKeys = {};
    this.listeners = {
      keydown: this.onKeyDown.bind(this),
      keyup: this.onKeyUp.bind(this)
    };

    var sceneEl = this.el.sceneEl;
    if (sceneEl.addBehavior) {
      sceneEl.addBehavior(this);
      this.attachEventListeners();
    }
  },

  /*******************************************************************
  * Movement
  */

  update: function (previousData) {
    var data = this.data;
    var acceleration = data.acceleration;
    var easing = data.easing;
    var velocity = this.velocity;
    var prevTime = this.prevTime = this.prevTime || Date.now();
    var time = window.performance.now();
    var delta = (time - prevTime) / 1000;
    var keys = this.getKeys();
    var movementVector;
    var pitchAxis = data.pitchAxis;
    var rollAxis = data.rollAxis;
    var pitchSign = data.pitchAxisInverted ? -1 : 1;
    var rollSign = data.rollAxisInverted ? -1 : 1;
    var el = this.el;
    this.prevTime = time;

    // If data changed or FPS too low, reset velocity.
    if (previousData || delta > MAX_DELTA) {
      velocity[pitchAxis] = 0;
      velocity[rollAxis] = 0;
      return;
    }

    velocity[pitchAxis] -= velocity[pitchAxis] * easing * delta;
    velocity[rollAxis] -= velocity[rollAxis] * easing * delta;

    var position = el.getComputedAttribute('position');

    if (data.enabled) {
      if (data.pitchAxisEnabled) {
        if (keys.a || keys.Left)  { velocity[pitchAxis] -= pitchSign * acceleration * delta; } // Left
        if (keys.d || keys.Right) { velocity[pitchAxis] += pitchSign * acceleration * delta; } // Right
      }
      if (data.rollAxisEnabled) {
        if (keys.w || keys.Up)   { velocity[rollAxis] -= rollSign * acceleration * delta; } // Up
        if (keys.s || keys.Down) { velocity[rollAxis] += rollSign * acceleration * delta; } // Down
      }
    }

    movementVector = this.getMovementVector(delta);
    el.object3D.translateX(movementVector.x);
    el.object3D.translateY(movementVector.y);
    el.object3D.translateZ(movementVector.z);

    el.setAttribute('position', {
      x: position.x + movementVector.x,
      y: position.y + movementVector.y,
      z: position.z + movementVector.z
    });
  },

  getMovementVector: (function (delta) {
    var direction = new THREE.Vector3(0, 0, 0);
    var rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    return function (delta) {
      var velocity = this.velocity;
      var elRotation = this.el.getAttribute('rotation');
      direction.copy(velocity);
      direction.multiplyScalar(delta);
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

  tick: function (t) { // jshint ignore:line
    this.update();
  },

  remove: function () {
    this.pause();
  },

  attachEventListeners: function () {
    window.addEventListener('keydown', this.listeners.keydown, false);
    window.addEventListener('keyup', this.listeners.keyup, false);
  },

  removeEventListeners: function () {
    window.removeEventListener('keydown', this.listeners.keydown);
    window.removeEventListener('keyup', this.listeners.keyup);
  },

  onKeyDown: function (event) {
    this.localKeys[event.key] = true;
    this.emit(event);
  },

  onKeyUp: function (event) {
    delete this.localKeys[event.key];
    this.emit(event);
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
    this.el.emit(event.type + ':' + event.key, new KeyboardEvent(event.type, event));
    console.log(event.type + ':' + event.key);
  },

  /*******************************************************************
  * Accessors
  */
 
  isPressed: function (key) {
    return key in this.getKeys();
  },

  getKeys: function () {
    var proxyControls = this.el.components['proxy-controls'],
        proxyKeys = proxyControls && proxyControls.isConnected()
          && proxyControls.getKeyboard();
    return proxyKeys || this.localKeys;
  },

  isProxied: function () {
    return this.getKeys() === this.localKeys;
  }

};
