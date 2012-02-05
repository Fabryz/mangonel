(function(exports) {

	var Game = function () {
		this.desiredFPS = 60;
		this.allowSendEvery = 75; //TODO: tune this, 1/16s

		this.isReady = false;
		this.isPlaying = false;

		this.keys = this.loadKeys();

		this.debug('Game inited.');
	};

	Game.prototype.debug = function(msg) {
		console.log(msg);
	};

	Game.prototype.loadKeys = function() {
		return  {
			up : 38,
			down : 40,
			left : 37,
			right : 39,
			tab : 9,
			space : 32,
			enter : 13,
			w : 87,
			s : 83,
			a : 65,
			d : 68,
			backslash : 220
		};
	};

	Game.prototype.connect = function() {
		return new io.connect(window.location.href);
	};

	Game.prototype.init = function(canvas) {

	};

	Game.prototype.stop = function() {
		this.isPlaying = false;
	};

	Game.prototype.toggleDebugPanel = function(spd) {
		var speed = spd || 'fast';
	
		$('#debug').fadeToggle(speed);
		$('#debug').toggleClass("active");
		if ($('#debug').hasClass("active")) {

		} else {

		}
	};

	exports.Game = Game;
})(typeof global === "undefined" ? window : exports);