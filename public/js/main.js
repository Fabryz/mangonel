$(document).ready(function() {
	
	var clientId = $("#clientId"),
		tot = $("#tot");

	/*
	* Main
	*/

	var Game = new Mangonel();

	/* 
	* Socket.io
	*/
	    
    Game.socket.on('connect', function() {
    	Game.log('Connected.');
    	Game.start();
	});
			
	Game.socket.on('disconnect', function() {
		Game.log('Disconnected.');
		Game.stop();
	});
	
	Game.socket.on('clientId', function(data) {
    	clientId.html(data.id);
	});
	
	Game.socket.on('tot', function(data) {	
		tot.html(data.tot);
	});

});