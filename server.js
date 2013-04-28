/*
* Express
*/

var express = require('express'),
	socketio = require('socket.io'),
	http = require('http'),
    path = require('path');

var app = express();

// Configuration

app.configure(function(){
	app.set('port', process.env.PORT || 8080);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('short'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Routes

// app.get('/', function(req, res) {
//  res.sendfile('public/index.html');
// });

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port "+ app.get('port') +" in "+ app.get('env') +" mode.");
});

/*
* Socket.IO
*/

var	io = socketio.listen(server),
	Player = require('./public/js/Player.js').Player,
	players = [],
	totPlayers = 0,
	pings = [],
	pingInterval = null,
	pingEvery = 5000,
	projectiles = [],
	projectile_damage = 12,
	projectile_dtl = 200,
	tick = 0,
	tickInterval = 0;

io.configure(function() {
	io.enable('browser client minification');
	io.set('log level', 1);
});

var serverConfig = {
	maxPlayers: 32,
	speed: 20,
	spawns: [
		{ id: 0, name: 'spawnOne', spawnX: 100, spawnY: 100 },
		{ id: 1, name: 'spawnTwo', spawnX: 412, spawnY: 100 },
		{ id: 2, name: 'spawnThree', spawnX: 100, spawnY: 412 },
		{ id: 3, name: 'spawnFour', spawnX: 412, spawnY: 412 }
	],
	mapWidth: 512,
	mapHeight: 512
};

function getPlayerFromId(id) {
	var length = players.length;
	for(var i = 0; i < length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	}
	return null;
}

function getRandomSpawn() {
	var random = Math.floor(Math.random() * serverConfig.spawns.length);

	return serverConfig.spawns[random];
}

function newPlayer(client) {
	var randomSpawn = getRandomSpawn();

	p = new Player(client.id, randomSpawn.spawnX, randomSpawn.spawnY);
	players.push(p);

    client.emit('join', { player: p });
	client.broadcast.emit('newplayer', { player: p });

	console.log('+ New player: '+ p.nick);
}

function sendPlayerList(client) {
	client.emit('playerlist', { list: players }); //FIXME improve me
	console.log('* Sent player list to '+ client.id);
}

// Check if coords + size is inside map
// use (x, y, 1, 1) for a point
function checkMapBounds(x, y, width, height) {
	var safeX = x,
		safeY = y;

	if (x < 0) {
		safeX = 0;
	} else if ((x + width) > serverConfig.mapWidth) {
		safeX = serverConfig.mapWidth - width;
	}

	if (y < 0) {
		safeY = 0;
	} else if ((y + height) > serverConfig.mapHeight) {
		safeY = serverConfig.mapHeight - height;
	}

	return {
		x: safeX,
		y: safeY
	};
}

// Elaborate next position, send confirmed position to client
function sendGameData(client, data) {
	var oldMove = {},
		nextMove = {},
		safeMove = {};

	var length = players.length;
	for(var i = 0; i < length; i++) {
		if (players[i].id == data.id) { // find the player we're referring to

			oldMove.x = players[i].x;
			oldMove.y = players[i].y;

			switch(data.dir) { // calculate player's next position
				case 'l':
						nextMove.x = oldMove.x - serverConfig.speed;
						nextMove.y = oldMove.y;
					break;
				case 'r':
						nextMove.x = oldMove.x + serverConfig.speed;
						nextMove.y = oldMove.y;
					break;
				case 'u':
						nextMove.x = oldMove.x;
						nextMove.y = oldMove.y - serverConfig.speed;
					break;
				case 'd':
						nextMove.x = oldMove.x;
						nextMove.y = oldMove.y + serverConfig.speed;
					break;

				default:
					break;
			}

			// Check if he's going out of bounds
			// if so set him to a safe position on the edge
			safeMove = checkMapBounds(nextMove.x, nextMove.y, players[i].width, players[i].height);
			nextMove.x = safeMove.x;
			nextMove.y = safeMove.y;

			//update data structure with safe position and broadcast it
			players[i].x = nextMove.x;
			players[i].y = nextMove.y;

			io.sockets.emit('play', { id: players[i].id , x: nextMove.x, y: nextMove.y, dir: data.dir });
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

// update a precise field of a player
function updatePlayerField(player, field, newValue) {

	console.log(player.id, field, newValue);

	io.sockets.emit('updatePlayerField', { player: player.id, field: field, newValue: newValue });
}

function checkProjectileCollisions() {
	var length = players.length;
	for(var i = 0; i < length; i++) {
		projectiles.map(function(p) {
			if (((p.x + p.centerX >= players[i].x) && (p.x + p.centerX <= players[i].x + players[i].width)) &&
				((p.y + p.centerY >= players[i].y) && (p.y + p.centerY <= players[i].y + players[i].height))) {
				// players[i].HP -= projectile_damage;

				// updatePlayerField(players[i], 'HP', players[i].HP);
			} else {
				return p;
			}
		});
	}
}

function sendProjectile(projectile) {
	io.sockets.emit('projectile', { projectile: projectile });
}

function updateProjectile(client, data) {
	data.projectile.owner = client.id; // Setting projectile owner server side

	projectiles.push(data.projectile);

	var length = players.length;
	for(var i = 0; i < length; i++) {
		if (players[i].id == data.projectile.owner) {
			players[i].lastShotAt = Date.now();
		}
	}

	checkProjectileCollisions();

	sendProjectile(data.projectile);
}

function updateProjectilesMapBounds() {
	//remove projectiles outside canvas
	projectiles.map(function(p) {
		if ((p.x + p.centerX >= 0) && (p.x + p.centerX < serverConfig.mapWidth) &&
			(p.y + p.centerY >= 0) && (p.y + p.centerY < serverConfig.mapHeight)) {
			return p;
		}
	});
}

function updateProjectilesDtl() {
	//remove projectiles farer than distance to live
	projectiles.map(function(p) {
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

	sendProjectiles();
}

function sendProjectiles() {
	var length = projectiles.length;
	for(var i = 0; i < length; i++) {
		sendProjectiles(projectiles[i]);
	}
}

function serverLoop() {
	updateProjectiles();
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
	if ((totPlayers == 1) && (tickInterval === null)) {
		tickInterval = setInterval(serverLoop, 100);
	}

	client.on('play', function(data) {
		//console.dir(data);
		sendGameData(client, data);
	});

	client.on('projectile', function(data) {
		//console.dir(data);
		updateProjectile(client, data);
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

		if (totPlayers === 0) {
			clearTimeout(pingInterval);
			pingInterval = null;
			clearTimeout(tickInterval);
			tickInterval = null;
		}
	});
});