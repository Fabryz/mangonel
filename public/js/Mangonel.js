(function(exports) {

	var Mangonel = function() {
		var tick = 0;

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

		var gameBg = new Image();
			gameBg.src = '/img/starfield.pnga'; // FIXME

		// @TODO REFACTOR VARS
		var projectiles = [],
			angularSpeed = 10,
			projectile_speed = 5,
			projectile_damage = 12,
			projectile_dtl = 200,
			mouseX,
			mouseY,
			mouseSize = 10,
			mousePressed = false,
			lastShot = Date.now(),
			allowed = 100;

		function calcDistance(point1, point2) {
			var dx = point2.x - point1.x;
			var dy = point2.y - point1.y;

			return Math.sqrt(dx * dx + dy * dy);
		}

		function calcAngle(point1, point2) {
			//var dx = Math.abs(point2.x - point1.x);
			//var dy = Math.abs(point2.y - point1.y);

			var dx = point2.x - point1.x;
			var dy = point2.y - point1.y;

			return Math.atan2(dy, dx);
		}

		function shootProjectile() {
			var nowShot = Date.now();
			if (nowShot - lastShot > allowed) {
				var coords = mapToVp(player.x, player.y);
				var vangle = calcAngle({ x: coords.x + player.centerX, y: coords.y + player.centerY }, { x: mouseX, y: mouseY });
				var projectile = new Projectile(player.x + player.centerX, player.y + player.centerY, vangle);
				projectiles.push(projectile);

				lastShot = Date.now();
			}
		}

		$(canvas).bind("mousedown", function(e) {
			e.preventDefault();
			mousePressed = true;

			mouseX = e.offsetX || e.layerX;
			mouseY = e.offsetY || e.layerY;

			shootProjectile();
		});

		$(canvas).bind("mousemove", function(e) {
			mouseX = e.offsetX || e.layerX;
			mouseY = e.offsetY || e.layerY;
		});

		$(canvas).bind("mousepress", function(e) {
			shootProjectile();
		});

		$(canvas).bind("mouseup", function(e) {
			mousePressed = false;
		});

		function updateProjectilesMapBounds() {
			//remove projectiles outside canvas
			projectiles = $.map(projectiles, function(p) {
				if ((p.x + p.centerX >= 0) && (p.x + p.centerX < canvasWidth) &&
					(p.y + p.centerY >= 0) && (p.y + p.centerY < canvasHeight)) {
					return p;
				}
			});
		}

		function updateProjectilesDtl() {
			//remove projectiles farer than distance to live
			projectiles = $.map(projectiles, function(p) {
				if (p.dtl <= projectile_dtl) {
					return p;
				}
			});
		}

		function updateProjectiles() {
			var length = projectiles.length;
			for(var i = 0; i < length; i++) {
				var stepX = Math.cos(projectiles[i].angle) * projectile_speed;
				var stepY = Math.sin(projectiles[i].angle) * projectile_speed;
				projectiles[i].x += stepX;
				projectiles[i].y += stepY;
				projectiles[i].dtl += Math.sqrt(stepX * stepX + stepY * stepY);
				// ctx.fillText(projectiles[i].dtl, 10, 50);
			}

			updateProjectilesDtl();
			updateProjectilesMapBounds();
		}

		function drawClick() {
			if (mousePressed) {
				var coords = mapToVp(player.x, player.y);

				ctx.save();
				ctx.strokeStyle = "rgb(0, 0, 255)";
				ctx.fillRect(mouseX - mouseSize / 2, mouseY - mouseSize / 2, mouseSize, mouseSize);
				ctx.beginPath();
				ctx.moveTo(coords.x + player.centerX, coords.y + player.centerY);
				ctx.lineTo(mouseX, mouseY);
				ctx.stroke();
				ctx.restore();
			}
		}

		function toRadians(alpha) {
			return alpha * (Math.PI / 180);
		}

		function toDegrees(alpha) {
			return alpha * (180 / Math.PI);
		}

		function drawProjectiles() {
			drawClick();

			var length = projectiles.length;
			for(var i = 0; i < length; i++) {
				ctx.save();

				var coords = mapToVp(projectiles[i].x, projectiles[i].y);
				ctx.translate(coords.x + projectiles[i].centerX, coords.y + projectiles[i].centerY);
				ctx.rotate(projectiles[i].angle);
				ctx.fillStyle = "#FF0000";
				ctx.fillRect(- projectiles[i].width / 2, - projectiles[i].height / 2, projectiles[i].width, projectiles[i].height);
				ctx.fillStyle = "rgb(255, 255, 0)";
				// ctx.fillRect(0, 0, 1, 1);
				ctx.restore();

				//debug
				//ctx.fillText(toDegrees(projectiles[i].angle) , coords.x, coords.y - 10);
				//ctx.fillText((coords.x + projectiles[i].centerX - player.centerX) +" "+ (coords.y + projectiles[i].centerY - player.centerY), 10, 40);
			}
		}

		function isAlive(actor) {
			return (actor.HP > 0 ? true : false);
		}

		function checkCollisions(enemy) {
			projectiles = $.map(projectiles, function(p) {
				if (((p.x + p.centerX >= enemy.x) && (p.x + p.centerX <= enemy.x + enemy.width)) &&
					((p.y + p.centerY >= enemy.y) && (p.y + p.centerY <= enemy.y + enemy.height))) {
					enemy.HP -= projectile_damage;
				} else {
					return p;
				}
			});
		}

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
						case keyboard.a:
								player.moveLeft = true;
							break;
						case keyboard.right_arrow:
						case keyboard.d:
								player.moveRight = true;
							break;
						case keyboard.up_arrow:
						case keyboard.w:
								player.moveUp = true;
							break;
						case keyboard.down_arrow:
						case keyboard.s:
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
						case keyboard.a:
								player.moveLeft = false;
							break;
						case keyboard.right_arrow:
						case keyboard.d:
								player.moveRight = false;
							break;
						case keyboard.up_arrow:
						case keyboard.w:
								player.moveUp = false;
							break;
						case keyboard.down_arrow:
						case keyboard.s:
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


		var drawMapBounds = function() {
			var coords = mapToVp(0, 0);

			ctx.save();
			ctx.strokeStyle = "#AAA";
			ctx.lineWidth = 8;
			ctx.strokeRect(coords.x - 4, coords.y - 4, canvasWidth + 8, canvasHeight + 8);
			ctx.restore();
		};

		drawMapBG = function() {
			var coords = mapToVp(- canvasWidth / 2, - canvasHeight / 2);

			ctx.save();
			// gameBg.onload = function() {
				ctx.drawImage(gameBg, coords.x , coords.y);
			// };
			ctx.restore();
		};

		var drawPlayer = function(p) {
			var coords = mapToVp(p.x, p.y);

			ctx.save();

			ctx.translate(coords.x + (p.width / 2), coords.y + (p.height / 2));
			ctx.beginPath();
			ctx.fillStyle = "#FFF";

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

				drawMapBG();
				drawMapBounds();

				if (mousePressed) {
					shootProjectile();
				}

				updateProjectiles();


				var length = players.length;
				for(var i = 0; i < length; i++) {
					if (players[i].id != player.id) {
						checkCollisions(players[i]);
					}
				}

				drawPlayer(player);

				var length = players.length;
				for(var i = 0; i < length; i++) {
					var coords = mapToVp(players[i].x, players[i].y);
					ctx.fillText(players[i].HP, coords.x + players[i].centerX, coords.y + players[i].centerY - 20); // debug
					if (players[i].id != player.id) {
						drawPlayer(players[i]);
					}
				}

				drawProjectiles();

				fps.count++;
				tick++;
				requestAnimationFrame(loop);
				//setTimeout(loop, desiredFPS); //debug
			}
		};

		socket.on('join', function(data) {
			jQuery.extend(true, player, data.player);

			debug('You have joined the server. (id: '+ player.id +').');
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

			debug('< Player quitted: '+ quitter +' (id '+ data.id +')');
		});

		socket.on('newplayer', function(data) {
			var newPlayer = new Player();
			jQuery.extend(true, newPlayer, data.player);
			players.push(newPlayer);

			debug('> New player joined: '+ newPlayer.nick +' (id: '+ newPlayer.id +').');
			newPlayer = {};
		});

		socket.on('playerlist', function(data) {
			players = []; //prepare for new list

			var length = data.list.length;
			for(var i = 0; i < length; i++) {
				var tmpPlayer = new Player();
				jQuery.extend(true, tmpPlayer, data.list[i]);

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