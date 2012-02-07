(function(exports) {

	var Mangonel = function() {
		var desiredFPS = 60,
			allowSendEvery = 75,
			isReady = true,
			isPlaying = false,
			fps_handle = $("#fps"),
			keys = {
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
			debug('* Mangonel stopped.');
		};

		var toggleDebugPanel = function(spd) {
			var speed = spd || 'fast';
		
			$('#debug').fadeToggle(speed);
			$('#debug').toggleClass("active");
			if ($('#debug').hasClass("active")) {

			} else {

			}
		};

		var start = function() {
			if (isReady) {
				debug('* Mangonel started.');
				isPlaying = true;
				
				$(window).keydown(function(e) {
					//e.preventDefault();

					switch(e.keyCode) {
						case keys.left:
								player.moveLeft = true;
							break;
						case keys.right:
								player.moveRight = true;
							break;
						case keys.up:
								player.moveUp = true;
							break;
						case keys.down:
								player.moveDown = true;
							break;

						default:
							break;
					}

				});
				
				$(window).keypress(function(e) {
					//e.preventDefault();
					var keyCode = e.keyCode;
				
				});

				$(window).keyup(function(e) {
					//e.preventDefault();
					
					switch(e.keyCode) {
						case keys.left:
								player.moveLeft = false;
							break;
						case keys.right:
								player.moveRight = false;
							break;
						case keys.up:
								player.moveUp = false;
							break;
						case keys.down:
								player.moveDown = false;
							break;

						case keys.backslash:
								toggleDebugPanel();
							break;

						default:
							break;
					}
				});

				fps.init(fps_handle);

				loop();
			} else {
				debug('* Mangonel not ready.');
			}
		};

		var loop = function() {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			
			if (isPlaying) {			
				sendMovement();

				player.draw(ctx);

				var length = players.length;
				for(var i = 0; i < length; i++) {
					if (players[i].id != player.id) {
						players[i].draw(ctx);
			    	}
				}
				
				fps.count++;

				requestAnimationFrame(loop);
			}
		}

		var sendMovement = function() {
			var nowMove;

			if (player.hasMoved()) {
				var dir = 'idle';

				if (player.moveLeft) {
					dir = 'l';
				}
				if (player.moveRight) {
					dir = 'r';
				}
				if (player.moveUp) {
					dir = 'u';
				}
				if (player.moveDown) {
					dir = 'd';
				}

				nowMove = Date.now();
				if ((nowMove - player.lastMove) > allowSendEvery) { 
					socket.emit('play', { id: player.id, dir: dir });
					player.lastMove = Date.now();
				}
			}
		};

		socket.on('join', function(data) {						
			player.id = data.player.id;
			player.nick = data.player.nick;
			player.x = data.player.x;
			player.y = data.player.y;
			
			debug('Received current player id: '+ player.id);
			debug('You have joined the server.');
		});

		socket.on('quit', function(data) {
			var quitter = '';

			var length = players.length;
			for(var i = 0; i < length; i++) {
				if (players[i].id == data.id) {
					quitter = players[i].nick;
					players.splice(i, 1);
					break;
				}
			}
			
			debug('Player quitted: '+ quitter +' (id '+ data.id +')');
		});

		socket.on('newplayer', function(data) {	
			var newPlayer = new Player();
			newPlayer.id = data.player.id;
			newPlayer.nick = data.player.nick;
			newPlayer.x = data.player.x;
			newPlayer.y = data.player.y;
		
			players.push(newPlayer);
			debug('New player joined: '+ newPlayer.nick);
			tmpPlayer = {};
		});
		
		socket.on('playerlist', function(data) {				
			players = []; //prepare for new list

			var length = data.list.length;
			for(var i = 0; i < length; i++) {		
				var tmpPlayer = new Player();
				tmpPlayer.id = data.list[i].id;
				tmpPlayer.nick = data.list[i].nick;
				tmpPlayer.x = data.list[i].x;
				tmpPlayer.y = data.list[i].y;
				tmpPlayer.ping = data.list[i].ping;
				
				players.push(tmpPlayer);
				tmpPlayer = {};
			}

			debug('Initial player list received: '+ length +' players.');	
		});

		socket.on('play', function(data) {
			var length = players.length;
			for(var i = 0; i < length; i++) {
				if (players[i].id == data.id) {
					players[i].x = data.x;
					players[i].y = data.y;
					if (player.id == data.id) {
						player.x = data.x;
						player.y = data.y;
					}
				}
			}
		});

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
			start: start,
			stop: stop,
			loop: loop,
			toggleDebugPanel: toggleDebugPanel
		};
	};

	exports.Mangonel = Mangonel;
})(typeof global === "undefined" ? window : exports);