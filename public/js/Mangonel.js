(function(exports) {

	var Mangonel = function() {
		var desiredFPS = 60,
			allowSendEvery = 75,
			isReady = true,
			isPlaying = false,
			fps_handle = $('#fps'),
			debugPanel = $('#debug'),
			scoreboard = $("#scoreboard"),
			keyboard = KEYCODES;

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

		var vp = new Viewport(canvasWidth, canvasHeight);

		var debug = function(msg) {
			console.log(msg);
		};

		var stop = function() {
			isPlaying = false;
			debug('* Mangonel stopped.');
		};

		var toggleDebugPanel = function(spd) {
			var speed = spd || 'fast';

			debugPanel.stop();
			debugPanel.fadeToggle(speed);
			debugPanel.toggleClass("active");
			if (debugPanel.hasClass("active")) {

			} else {

			}
		};

		var showScoreboard = function() {
			var list = scoreboard.find('ul');

			list.html('');
			var length = players.length;
			for(var i = 0; i < length; i++) {
				list.append("<li>"+ players[i] +"</li>");
			}

			list.append("<li>&nbsp;</li>");
			list.append("<li>Total players: "+ length +"</li>");
			scoreboard.show();
		};

		var start = function() {
			if (isReady) {
				debug('* Mangonel started.');
				isPlaying = true;

				$(window).keydown(function(e) {
					//e.preventDefault();

					switch(e.keyCode) {
						case keyboard.left_arrow:
								player.moveLeft = true;
							break;
						case keyboard.right_arrow:
								player.moveRight = true;
							break;
						case keyboard.up_arrow:
								player.moveUp = true;
							break;
						case keyboard.down_arrow:
								player.moveDown = true;
							break;

						case keyboard.tab:
								e.preventDefault();
								showScoreboard();
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
						case keyboard.left_arrow:
								player.moveLeft = false;
							break;
						case keyboard.right_arrow:
								player.moveRight = false;
							break;
						case keyboard.up_arrow:
								player.moveUp = false;
							break;
						case keyboard.down_arrow:
								player.moveDown = false;
							break;

						case keyboard.backslash:
								toggleDebugPanel();
							break;
						case keyboard.tab:
								scoreboard.hide();
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

		// send a movement every allowSendEvery milliseconds
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

				player.lastMoveDir = dir;

				nowMove = Date.now();
				if ((nowMove - player.lastMoveTime) > allowSendEvery) {
					socket.emit('play', { id: player.id, dir: dir });
					player.lastMoveTime = Date.now();
				}
			}
		};

		// Convert map coordinates to viewport coordinates
		var mapToVp = function(x, y) {
			var vpCoords = vp.getCenter();

			return {
				x: x - vpCoords.x,
				y: y - vpCoords.y
			};
		};


		drawMapBounds = function() {
			var coords = mapToVp(0, 0);

			ctx.save();
			ctx.strokeStyle = "#AAA";
			ctx.lineWidth = 8;
			ctx.strokeRect(coords.x - 4, coords.y - 4, canvasWidth + 8, canvasHeight + 8);
			ctx.restore();
		};

		var drawPlayer = function(p) {
			var coords = mapToVp(p.x, p.y);

			ctx.save();

			ctx.translate(coords.x + (p.width / 2), coords.y + (p.height / 2));
			ctx.beginPath();

			switch(p.lastMoveDir) {
				case 'l':
						ctx.moveTo(0, 5);
						ctx.lineTo(0, -5);
						ctx.lineTo(-5, 0);
					break;
				case 'r':
						ctx.moveTo(0, 5);
						ctx.lineTo(0, -5);
						ctx.lineTo(5, 0);
					break;
				case 'u':
						ctx.moveTo(-5, 0);
						ctx.lineTo(5, 0);
						ctx.lineTo(0, -5);
					break;
				case 'd':
						ctx.moveTo(-5, 0);
						ctx.lineTo(5, 0);
						ctx.lineTo(0, 5);
					break;
			}

			ctx.closePath();
			ctx.fill();

			ctx.restore();

			//ctx.fillRect(coords.x, coords.y, p.width, p.height);
		};

		var loop = function() {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			if (isPlaying) {
				sendMovement();

				vp.setCenter(player.x, player.y);

				drawMapBounds();
				drawPlayer(player);

				var length = players.length;
				for(var i = 0; i < length; i++) {
					if (players[i].id != player.id) {
						drawPlayer(players[i]);
					}
				}

				fps.count++;

				requestAnimationFrame(loop);
				//setTimeout(loop, desiredFPS); //debug
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
			newPlayer.lastMoveDir = data.player.lastMoveDir;

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
				tmpPlayer.lastMoveDir = data.list[i].lastMoveDir;
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
					players[i].lastMoveDir = data.dir;
					if (player.id == data.id) {
						player.x = data.x;
						player.y = data.y;
						player.lastMoveDir = data.dir;
					}
				}
			}
		});

		socket.on('ping', function(data) {
			socket.emit('pong', { time: Date.now() });
			//debug('Ping? Pong!');
		});

		socket.on('pingupdate', function(data) {
			var length = players.length;
			for(var i = 0; i < length; i++) {
				if (players[i].id == data.id) {
					players[i].ping = data.ping;
					if (player.id == data.id) {
						player.ping = data.ping;
						$("#ping").html(player.ping +'ms');
					}
				}
			}
		});

		return {
			socket: socket,
			keyboard: keyboard,
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