$(document).ready(function() {
	var Mangonel;
	
	var fps = $("#fps"),
		clientId = $("#clientId"),
		online = $("#online"),
		tot = $("#tot"),
		debug = $("#debug");

	function sendMovement() {
		var nowMove;

		if (Mangonel.player.hasMoved()) {
			var dir = 'idle';

			if (Mangonel.player.moveLeft) {
				dir = 'l';
			}
			if (Mangonel.player.moveRight) {
				dir = 'r';
			}
			if (Mangonel.player.moveUp) {
				dir = 'u';
			}
			if (Mangonel.player.moveDown) {
				dir = 'd';
			}

			nowMove = Date.now();
			if ((nowMove - Mangonel.player.lastMove) > Mangonel.allowSendEvery) { 
				Mangonel.socket.emit('play', { id: Mangonel.player.id, dir: dir });
				Mangonel.player.lastMove = Date.now();
			}
		}
	}

	function gameLoop() {
		Mangonel.ctx.clearRect(0, 0, Mangonel.canvasWidth, Mangonel.canvasHeight);
		
		if (Mangonel.isPlaying) {			
			sendMovement();

			Mangonel.player.draw(Mangonel.ctx);

			var length = Mangonel.players.length;
			for(var i = 0; i < length; i++) {
				if (Mangonel.players[i].id != Mangonel.player.id) {
					Mangonel.players[i].draw(Mangonel.ctx);
		    	}
			}
			
			Mangonel.fps.count++;

			requestAnimationFrame(gameLoop);
		}
	}

	function gameStart() {
		if (Mangonel.isReady) {
			Mangonel.debug('Ready! Starting.');
			Mangonel.isPlaying = true;
			
			$(window).keydown(function(e) {
				//e.preventDefault();

				switch(e.keyCode) {
					case Mangonel.keys.left:
							Mangonel.player.moveLeft = true;
						break;
					case Mangonel.keys.right:
							Mangonel.player.moveRight = true;
						break;
					case Mangonel.keys.up:
							Mangonel.player.moveUp = true;
						break;
					case Mangonel.keys.down:
							Mangonel.player.moveDown = true;
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
					case Mangonel.keys.left:
							Mangonel.player.moveLeft = false;
						break;
					case Mangonel.keys.right:
							Mangonel.player.moveRight = false;
						break;
					case Mangonel.keys.up:
							Mangonel.player.moveUp = false;
						break;
					case Mangonel.keys.down:
							Mangonel.player.moveDown = false;
						break;

					case Mangonel.keys.backslash:
							Mangonel.toggleDebugPanel();
						break;

					default:
						break;
				}
			});

			Mangonel.fps.init(fps);

			gameLoop();
		} else {
			Mangonel.debug('Not ready.');
		}
	}

	function gameInit() {
		Mangonel = new Game();
	}

	/*
	* Main
	*/

	gameInit();

	/* 
	* Socket.io
	*/
	    
    Mangonel.socket.on('connect', function() {
    	Mangonel.debug('Connected.');
    	gameStart();
	});
			
	Mangonel.socket.on('disconnect', function() {
		Mangonel.debug('Disconnected.');
		Mangonel.stop();
	});
	
	Mangonel.socket.on('clientId', function(data) {
    	clientId.html(data.id);
	});
	
	Mangonel.socket.on('tot', function(data) {	
		tot.html(data.tot);
	});

	/* Game logics */

	Mangonel.socket.on('join', function(data) {						
		Mangonel.player.id = data.player.id;
		Mangonel.player.nick = data.player.nick;
		Mangonel.player.x = data.player.x;
		Mangonel.player.y = data.player.y;
		
		Mangonel.debug('Received current player id: '+ Mangonel.player.id);
		Mangonel.debug('You have joined the server.');
	});

	Mangonel.socket.on('quit', function(data) {
		var quitter = '';

		var length = Mangonel.players.length;
		for(var i = 0; i < length; i++) {
			if (Mangonel.players[i].id == data.id) {
				quitter = Mangonel.players[i].nick;
				Mangonel.players.splice(i, 1);
				break;
			}
		}
		
		Mangonel.debug('Player quitted: '+ quitter +' (id '+ data.id +')');
	});

	Mangonel.socket.on('newplayer', function(data) {	
		var newPlayer = new Player();
		newPlayer.id = data.player.id;
		newPlayer.nick = data.player.nick;
		newPlayer.x = data.player.x;
		newPlayer.y = data.player.y;
	
		Mangonel.players.push(newPlayer);
		Mangonel.debug('New player joined: '+ newPlayer.nick);
		tmpPlayer = {};
	});
	
	Mangonel.socket.on('playerlist', function(data) {				
		Mangonel.players = []; //prepare for new list

		var length = data.list.length;
		for(var i = 0; i < length; i++) {		
			var tmpPlayer = new Player();
			tmpPlayer.id = data.list[i].id;
			tmpPlayer.nick = data.list[i].nick;
			tmpPlayer.x = data.list[i].x;
			tmpPlayer.y = data.list[i].y;
			tmpPlayer.ping = data.list[i].ping;
			
			Mangonel.players.push(tmpPlayer);
			tmpPlayer = {};
		}

		Mangonel.debug('Initial player list received: '+ length +' players.');	
	});

	Mangonel.socket.on('play', function(data) {
		var length = Mangonel.players.length;
		for(var i = 0; i < length; i++) {
			if (Mangonel.players[i].id == data.id) {
				Mangonel.players[i].x = data.x;
				Mangonel.players[i].y = data.y;
				if (Mangonel.player.id == data.id) {
					Mangonel.player.x = data.x;
					Mangonel.player.y = data.y;
				}
			}
		}
	});

});