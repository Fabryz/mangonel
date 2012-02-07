$(document).ready(function() {
	
	var clientId = $("#clientId"),
		online = $("#online"),
		tot = $("#tot"),
		debug = $("#debug");

	/*
	* Main
	*/

	var Game = new Mangonel();

	/* 
	* Socket.io
	*/
	    
    Game.socket.on('connect', function() {
    	Game.debug('Connected.');
    	Game.start();
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