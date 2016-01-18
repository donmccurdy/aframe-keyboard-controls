/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	// Browser distrubution of the A-Frame component.
	(function (AFRAME) {
	  if (!AFRAME) {
	    console.error('Component attempted to register before AFRAME was available.');
	    return;
	  }

	  (AFRAME.aframeCore || AFRAME).registerComponent('keyboard-controls', __webpack_require__(1));

	}(window.AFRAME));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(2).polyfill();

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
	    if (this.isProxied()) {
	      return this.el.components['proxy-controls'].getKeyboard();
	    }
	    return this.localKeys;
	  },

	  isProxied: function () {
	    var proxyControls = this.el.components['proxy-controls'];
	    return proxyControls && proxyControls.isConnected();
	  }

	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/* global define, KeyboardEvent, module */

	(function () {

	  var keyboardeventKeyPolyfill = {
	    polyfill: polyfill,
	    keys: {
	      3: 'Cancel',
	      6: 'Help',
	      8: 'Backspace',
	      9: 'Tab',
	      12: 'Clear',
	      13: 'Enter',
	      16: 'Shift',
	      17: 'Control',
	      18: 'Alt',
	      19: 'Pause',
	      20: 'CapsLock',
	      27: 'Escape',
	      28: 'Convert',
	      29: 'NonConvert',
	      30: 'Accept',
	      31: 'ModeChange',
	      33: 'PageUp',
	      34: 'PageDown',
	      35: 'End',
	      36: 'Home',
	      37: 'ArrowLeft',
	      38: 'ArrowUp',
	      39: 'ArrowRight',
	      40: 'ArrowDown',
	      41: 'Select',
	      42: 'Print',
	      43: 'Execute',
	      44: 'PrintScreen',
	      45: 'Insert',
	      46: 'Delete',
	      48: ['0', ')'],
	      49: ['1', '!'],
	      50: ['2', '@'],
	      51: ['3', '#'],
	      52: ['4', '$'],
	      53: ['5', '%'],
	      54: ['6', '^'],
	      55: ['7', '&'],
	      56: ['8', '*'],
	      57: ['9', '('],
	      91: 'OS',
	      93: 'ContextMenu',
	      144: 'NumLock',
	      145: 'ScrollLock',
	      181: 'VolumeMute',
	      182: 'VolumeDown',
	      183: 'VolumeUp',
	      186: [';', ':'],
	      187: ['=', '+'],
	      188: [',', '<'],
	      189: ['-', '_'],
	      190: ['.', '>'],
	      191: ['/', '?'],
	      192: ['`', '~'],
	      219: ['[', '{'],
	      220: ['\\', '|'],
	      221: [']', '}'],
	      222: ["'", '"'],
	      224: 'Meta',
	      225: 'AltGraph',
	      246: 'Attn',
	      247: 'CrSel',
	      248: 'ExSel',
	      249: 'EraseEof',
	      250: 'Play',
	      251: 'ZoomOut'
	    }
	  };

	  // Function keys (F1-24).
	  var i;
	  for (i = 1; i < 25; i++) {
	    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
	  }

	  // Printable ASCII characters.
	  var letter = '';
	  for (i = 65; i < 91; i++) {
	    letter = String.fromCharCode(i);
	    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
	  }

	  function polyfill () {
	    if (!('KeyboardEvent' in window) ||
	        'key' in KeyboardEvent.prototype) {
	      return false;
	    }

	    // Polyfill `key` on `KeyboardEvent`.
	    var proto = {
	      get: function (x) {
	        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];

	        if (Array.isArray(key)) {
	          key = key[+this.shiftKey];
	        }

	        return key;
	      }
	    };
	    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
	    return proto;
	  }

	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (keyboardeventKeyPolyfill), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
	    module.exports = keyboardeventKeyPolyfill;
	  } else if (window) {
	    window.keyboardeventKeyPolyfill = keyboardeventKeyPolyfill;
	  }

	})();


/***/ }
/******/ ]);