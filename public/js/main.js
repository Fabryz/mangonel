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

});