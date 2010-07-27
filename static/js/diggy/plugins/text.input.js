/**
 * Creates a text input.
 * @param {Object} conf The configuration settings for this new Sprite Sheet object.
 * @namespace DGE
 * @class Text.Input
 * @constructor
 * @extends DGE.Object
 */
DGE.Text.Input = DGE.Text.extend(function(conf) {

	if (conf === undefined) return;

	this.initInput(conf);

}, {
	selectable : true
}, {
	'on:change' : function(fn) {

		var that = this;

		this.node.onchange = function() {
			fn.apply(that, [that.node.value]);
		};

	},
	'on:keyUp' : function(fn) {

		var that = this;

		this.node.onkeyup = function() {
			fn.apply(that, [that.node.value]);
		};

	},
	'change:value' : function(value) {
		this.node.value = value;
		this.fire('change', value);
	}
});

DGE.Text.Input.prototype.initInput = function(conf) {

	this.node = document.createElement('input');

	return this.initSprite(conf);

};
