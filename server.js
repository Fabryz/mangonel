/*
* Express
*/

var express = require('express'),
	app = module.exports = express.createServer();

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	app.use(express.logger(':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));
	app.use(express.favicon());
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

// Routes

app.get('/',  function(req, res) {
	res.sendfile('index.html');
});

app.listen(8080);
console.log("* Express server listening in %s mode", app.settings.env);

/*
* Socket.IO
*/

var	io = require('socket.io').listen(app),
	Player = require('./public/js/Player.js').Player,
	players = [],
 	totPlayers = 0,
 	pings = [],
 	pingInterval = null,
 	pingEvery = 5000;
	
io.configure(function() { 
	io.enable('browser client minification');
	io.set('log level', 1); 
}); 

var serverConfig = {
	maxPlayers: 32,
	speed: 10,
	spawnX: 100,	
	spawnY: 100
};

function getPlayerFromId(id) {
	var length = players.length;
	for(var i = 0; i < length; i++) { 
		if (players[i].id == id) {
			return players[i];
		}
	}
}

function newPlayer(client) {
	p = new Player(client.id, serverConfig.spawnX, serverConfig.spawnY);
	players.push(p);
	
    client.emit('join', { player: p });
	client.broadcast.emit('newplayer', { player: p });
	
	console.log('+ New player: '+ p.nick);
}

function sendPlayerList(client) {
	client.emit('playerlist', { list: players });
	console.log('* Sent player list to '+ client.id);
}

// Elaborate next position, send confirmed position to client 
function sendGameData(client, data) { //TODO: Do bounds and anticheat checks
	var nextX,
		nextY,
		oldX,
		oldY;

	var length = players.length;
	for(var i = 0; i < length; i++) {
		if (players[i].id == data.id) {

			oldX = players[i].x;
			oldY = players[i].y;
			
			switch(data.dir) {
				case 'l':
						nextX = oldX - serverConfig.speed;
						nextY = oldY;
					break;
				case 'r':
						nextX = oldX + serverConfig.speed;
						nextY = oldY;
					break;
				case 'u':
						nextX = oldX;
						nextY = oldY - serverConfig.speed;
					break;
				case 'd':
						nextX = oldX;
						nextY = oldY + serverConfig.speed;
					break;

				default:
					break;
			}

			players[i].x = nextX;
			players[i].y = nextY;

			io.sockets.emit('play', { id: players[i].id , x: nextX, y: nextY });
			break;
		}
	}	
}

// ping is intended as server -> client -> server time	
function pingClients() {
	var length = players.length;
	for(var i = 0; i < length; i++) {
		if (players[i].id) {
			pings[players[i].id] = { time: Date.now(), ping: 0 };
			//console.log('Ping? '+ players[i].id); //log filler
			game.sockets[players[i].id].emit('ping');
		}
	}
}

var game = io.sockets.on('connection', function(client) {
	newPlayer(client);	
	sendPlayerList(client);

	totPlayers++;
	console.log('+ Player '+ client.id +' connected, total players: '+ totPlayers);

	client.emit('clientId', { id: client.id });
	io.sockets.emit('tot', { tot: totPlayers });

	if ((totPlayers == 1) && (pingInterval === null)) {
		pingInterval = setInterval(pingClients, pingEvery);
	}

	client.on('play', function(data) {
		//console.dir(data);
		sendGameData(client, data);
	});

	client.on('pong', function(data) {		
		pings[client.id] = { ping: (Date.now() - pings[client.id].time) };

		var length = players.length;
		for(var i = 0; i < length; i++) {
			if (players[i].id == client.id) {
				players[i].ping = pings[client.id].ping;
				break;
			}
		}

		//console.log('Pong! '+ client.id +' '+ pings[client.id].ping +'ms'); //log filler

		//broadcast confirmed player ping
		game.emit('pingupdate', { id: client.id, ping: pings[client.id].ping });
	});

	client.on('disconnect', function() {
		var quitter = '';
		
		var length = players.length;
		for(var i = 0; i < length; i++) {
			if (players[i].id == client.id) {
				quitter = players[i].nick;
				players.splice(i, 1);
				break;
			}
		}

		totPlayers--;
		client.broadcast.emit('quit', { id: client.id });
		io.sockets.emit('tot', { tot: totPlayers });
		console.log('- Player '+ quitter +' ('+ client.id +') disconnected, total players: '+ totPlayers);

		if (totPlayers == 0) {
			clearTimeout(pingInterval);
			pingInterval = null;
		}
	});
});