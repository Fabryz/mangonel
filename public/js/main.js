$(document).ready(function() {
	var Game;
	
	var fps = $("#fps"),
		clientId = $("#clientId"),
		online = $("#online"),
		tot = $("#tot"),
		debug = $("#debug");

	function sendMovement() {
		var nowMove;

		if (Game.player.hasMoved()) {
			var dir = 'idle';

			if (Game.player.moveLeft) {
				dir = 'l';
			}
			if (Game.player.moveRight) {
				dir = 'r';
			}
			if (Game.player.moveUp) {
				dir = 'u';
			}
			if (Game.player.moveDown) {
				dir = 'd';
			}

			nowMove = Date.now();
			if ((nowMove - Game.player.lastMove) > Game.allowSendEvery) { 
				Game.socket.emit('play', { id: Game.player.id, dir: dir });
				Game.player.lastMove = Date.now();
			}
		}
	}

	function gameLoop() {
		Game.ctx.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);
		
		if (Game.isPlaying) {			
			sendMovement();

			Game.player.draw(Game.ctx);

			var length = Game.players.length;
			for(var i = 0; i < length; i++) {
				if (Game.players[i].id != Game.player.id) {
					Game.players[i].draw(Game.ctx);
		    	}
			}
			
			Game.fps.count++;

			requestAnimationFrame(gameLoop);
		}
	}

	function gameStart() {
		if (Game.isReady) {
			Game.debug('Ready! Starting.');
			Game.isPlaying = true;
			
			$(window).keydown(function(e) {
				//e.preventDefault();

				switch(e.keyCode) {
					case Game.keys.left:
							Game.player.moveLeft = true;
						break;
					case Game.keys.right:
							Game.player.moveRight = true;
						break;
					case Game.keys.up:
							Game.player.moveUp = true;
						break;
					case Game.keys.down:
							Game.player.moveDown = true;
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
					case Game.keys.left:
							Game.player.moveLeft = false;
						break;
					case Game.keys.right:
							Game.player.moveRight = false;
						break;
					case Game.keys.up:
							Game.player.moveUp = false;
						break;
					case Game.keys.down:
							Game.player.moveDown = false;
						break;

					case Game.keys.backslash:
							Game.toggleDebugPanel();
						break;

					default:
						break;
				}
			});

			Game.fps.init(fps);

			gameLoop();
		} else {
			Game.debug('Not ready.');
		}
	}

	function gameInit() {
		Game = new Mangonel();
	}

	/*
	* Main
	*/

	gameInit();

	/* 
	* Socket.io
	*/
	    
    Game.socket.on('connect', function() {
    	Game.debug('Connected.');
    	gameStart();
	});
			
	Game.socket.on('disconnect', function() {
		Game.debug('Disconnected.');
		Game.stop();
	});
	
	Game.socket.on('clientId', function(data) {
    	clientId.html(data.id);
	});
	
	Game.socket.on('tot', function(data) {	
		tot.html(data.tot);
	});

	/* Game logics */

	Game.socket.on('join', function(data) {						
		Game.player.id = data.player.id;
		Game.player.nick = data.player.nick;
		Game.player.x = data.player.x;
		Game.player.y = data.player.y;
		
		Game.debug('Received current player id: '+ Game.player.id);
		Game.debug('You have joined the server.');
	});

	Game.socket.on('quit', function(data) {
		var quitter = '';

		var length = Game.players.length;
		for(var i = 0; i < length; i++) {
			if (Game.players[i].id == data.id) {
				quitter = Game.players[i].nick;
				Game.players.splice(i, 1);
				break;
			}
		}
		
		Game.debug('Player quitted: '+ quitter +' (id '+ data.id +')');
	});

	Game.socket.on('newplayer', function(data) {	
		var newPlayer = new Player();
		newPlayer.id = data.player.id;
		newPlayer.nick = data.player.nick;
		newPlayer.x = data.player.x;
		newPlayer.y = data.player.y;
	
		Game.players.push(newPlayer);
		Game.debug('New player joined: '+ newPlayer.nick);
		tmpPlayer = {};
	});
	
	Game.socket.on('playerlist', function(data) {				
		Game.players = []; //prepare for new list

		var length = data.list.length;
		for(var i = 0; i < length; i++) {		
			var tmpPlayer = new Player();
			tmpPlayer.id = data.list[i].id;
			tmpPlayer.nick = data.list[i].nick;
			tmpPlayer.x = data.list[i].x;
			tmpPlayer.y = data.list[i].y;
			tmpPlayer.ping = data.list[i].ping;
			
			Game.players.push(tmpPlayer);
			tmpPlayer = {};
		}

		Game.debug('Initial player list received: '+ length +' players.');	
	});

	Game.socket.on('play', function(data) {
		var length = Game.players.length;
		for(var i = 0; i < length; i++) {
			if (Game.players[i].id == data.id) {
				Game.players[i].x = data.x;
				Game.players[i].y = data.y;
				if (Game.player.id == data.id) {
					Game.player.x = data.x;
					Game.player.y = data.y;
				}
			}
		}
	});

});