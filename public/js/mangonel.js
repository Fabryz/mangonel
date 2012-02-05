$(document).ready(function() {
	var game;

	var canvas = $("#canvas");
	
	var fps = $("#fps"),
		clientId = $("#clientId"),
		online = $("#online"),
		tot = $("#tot"),
		debug = $("#debug");

	function sendMovement() {
		var nowMove;

		if (game.player.hasMoved()) {
			var dir = 'idle';

			if (game.player.moveLeft) {
				dir = 'l';
			}
			if (game.player.moveRight) {
				dir = 'r';
			}
			if (game.player.moveUp) {
				dir = 'u';
			}
			if (game.player.moveDown) {
				dir = 'd';
			}

			nowMove = Date.now();
			if ((nowMove - game.player.lastMove) > game.allowSendEvery) { 
				game.socket.emit('play', { id: game.player.id, dir: dir });
				game.player.lastMove = Date.now();
			}
		}
	}

	function gameLoop() {
		game.ctx.clearRect(0, 0, game.canvasWidth, game.canvasHeight);
		
		if (game.isPlaying) {			
			sendMovement();

			game.player.draw(game.ctx);

			var length = game.players.length;
			for(var i = 0; i < length; i++) {
				if (game.players[i].id != game.player.id) {
					game.players[i].draw(game.ctx);
		    	}
			}
			
			game.fps.count++;

			requestAnimationFrame(gameLoop);
		}
	}

	function gameStart() {
		if (game.isReady) {
			game.debug('Ready! Starting.');
			game.isPlaying = true;
			
			$(window).keydown(function(e) {
				//e.preventDefault();

				switch(e.keyCode) {
					case game.keys.left:
							game.player.moveLeft = true;
						break;
					case game.keys.right:
							game.player.moveRight = true;
						break;
					case game.keys.up:
							game.player.moveUp = true;
						break;
					case game.keys.down:
							game.player.moveDown = true;
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
					case game.keys.left:
							game.player.moveLeft = false;
						break;
					case game.keys.right:
							game.player.moveRight = false;
						break;
					case game.keys.up:
							game.player.moveUp = false;
						break;
					case game.keys.down:
							game.player.moveDown = false;
						break;

					case game.keys.backslash:
							game.toggleDebugPanel();
						break;

					default:
						break;
				}
			});

			game.fps.init(fps);

			gameLoop();
		} else {
			console.log('Not ready.');
		}
	}

	function gameInit() {
		game = new Game();

		game.player = new Player();
		game.players = [];

		game.canvas = canvas;
		game.ctx = canvas.get(0).getContext("2d");
		game.canvasWidth = canvas.width();
		game.canvasHeight = canvas.height();

		game.ctx.fillStyle = 'rgb(0, 0, 0)';
		game.ctx.font = "15px Monospace";

		game.fps = new Fps(2000);

		game.socket = game.connect();
		game.debug('Connecting...');

		game.isReady = true;
	}

	/*
	* Main
	*/

	gameInit();

	/* 
	* Socket.io
	*/
	    
    game.socket.on('connect', function() {
    	game.debug('Connected.');
    	gameStart();
	});
			
	game.socket.on('disconnect', function() {
		game.debug('Disconnected.');
		game.stop();
	});
	
	game.socket.on('clientId', function(data) {
    	clientId.html(data.id);
	});
	
	game.socket.on('tot', function(data) {	
		tot.html(data.tot);
	});

	/* Game logics */

	game.socket.on('join', function(data) {						
		game.player.id = data.player.id;
		game.player.nick = data.player.nick;
		game.player.x = data.player.x;
		game.player.y = data.player.y;
		
		game.debug('Received current player id: '+ game.player.id);
		game.debug('You have joined the server.');
	});

	game.socket.on('quit', function(data) {
		var quitter = '';

		var length = game.players.length;
		for(var i = 0; i < length; i++) {
			if (game.players[i].id == data.id) {
				quitter = game.players[i].nick;
				game.players.splice(i, 1);
				break;
			}
		}
		
		game.debug('Player quitted: '+ quitter +' (id '+ data.id +')');
	});

	game.socket.on('newplayer', function(data) {	
		var newPlayer = new Player();
		newPlayer.id = data.player.id;
		newPlayer.nick = data.player.nick;
		newPlayer.x = data.player.x;
		newPlayer.y = data.player.y;
	
		game.players.push(newPlayer);
		game.debug('New player joined: '+ newPlayer.nick);
		tmpPlayer = {};
	});
	
	game.socket.on('playerlist', function(data) {				
		game.players = []; //prepare for new list

		var length = data.list.length;
		for(var i = 0; i < length; i++) {		
			var tmpPlayer = new Player();
			tmpPlayer.id = data.list[i].id;
			tmpPlayer.nick = data.list[i].nick;
			tmpPlayer.x = data.list[i].x;
			tmpPlayer.y = data.list[i].y;
			tmpPlayer.ping = data.list[i].ping;
			
			game.players.push(tmpPlayer);
			tmpPlayer = {};
		}

		game.debug('Initial player list received: '+ length +' players.');	
	});

	game.socket.on('play', function(data) {
		var length = game.players.length;
		for(var i = 0; i < length; i++) {
			if (game.players[i].id == data.id) {
				game.players[i].x = data.x;
				game.players[i].y = data.y;
				if (game.player.id == data.id) {
					game.player.x = data.x;
					game.player.y = data.y;
				}
			}
		}
	});

});