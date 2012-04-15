$(document).ready(function() {
	
	var tot = $("#tot");

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
	
	Game.socket.on('tot', function(data) {	
		tot.html(data.tot);
		Game.debug("Current players number: "+ data.tot);
	});

});