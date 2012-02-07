(function(exports) {

	var Mangonel = function() {
		var desiredFPS = 60,
			allowSendEvery = 75,
			isReady = true,
			isPlaying = false;
		
		var	keys = {
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
		
		var player = new Player(),
			players = [];

		var fps = new Fps(2000),
			socket = new io.connect(window.location.href);
		
		var canvas = $('#canvas'),
			ctx = canvas.get(0).getContext("2d"),
			canvasWidth = canvas.width(),
			canvasHeight = canvas.height();

		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.font = "15px Monospace";
	
		var debug = function(msg) {
			console.log(msg);
		};

		var stop = function() {
			isPlaying = false;
		};

		var toggleDebugPanel = function(spd) {
			var speed = spd || 'fast';
		
			$('#debug').fadeToggle(speed);
			$('#debug').toggleClass("active");
			if ($('#debug').hasClass("active")) {

			} else {

			}
		};

		return {
			socket: socket,
			keys: keys,
			player: player,
			players: players,
			desiredFPS: desiredFPS,
			allowSendEvery: allowSendEvery,
			isReady: isReady,
			isPlaying: isPlaying,
			fps: fps,
			canvas: canvas,
			ctx: ctx,
			canvasWidth: canvasWidth,
			canvasHeight: canvasHeight,

			debug: debug,
			stop: stop,
			toggleDebugPanel: toggleDebugPanel
		};
	};

	exports.Mangonel = Mangonel;
})(typeof global === "undefined" ? window : exports);