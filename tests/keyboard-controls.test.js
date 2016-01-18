var Aframe = require('aframe-core');
var component = require('../keyboard-controls');
var entityFactory = require('./helpers').entityFactory;

Aframe.registerComponent('keyboard-controls', component);

describe('Keyboard Controls', function () {

	/*******************************************************************
	* Setup
	*/

	var EPS = 1e-6;

	var ctrl,
		currentTime = 0;

	beforeEach(function () {
		// Mock time
		currentTime = 0;
		this.sinon.stub(window.performance, 'now', function () { return currentTime; });
	});

	beforeEach(function (done) {
		this.el = entityFactory();
		this.el.setAttribute('keyboard-controls', '');
		this.el.addEventListener('loaded', function () {
			ctrl = this.el.components['keyboard-controls'];
			done();
		}.bind(this));
	});

	/*******************************************************************
	* Tests
	*/

	describe('Accessors', function () {
		it('is attached to component', function () {
			expect(ctrl).to.be.ok;
		});
	});

});
