(function(exports) {

	var Player = function(id, x, y) {
		this.id = id || 0;
		this.nick = 'Player'+ this.id;
		this.x = x || 0;
		this.y = y || 0;

		this.isAlive = true;
		this.HP = 100;
		this.lastMoveTime = Date.now();
		this.ping = 0;

		this.width = 10;
		this.height = 10;
		this.centerX = this.width / 2;
		this.centerY = this.height / 2;

		this.moved = false;
		this.moveLeft = false;
		this.moveRight = false;
		this.moveUp = false;
		this.moveDown = false;
		this.lastMoveDir = 'd';
	};

	Player.prototype.toString = function() {
		return /*this.id +' '+ */this.nick +' ('+ this.HP +') '+ this.x +':'+ this.y +' '+ this.ping +'ms';
	};

	Player.prototype.hasMoved = function() {
		this.moved = (this.moveLeft || this.moveRight || this.moveUp || this.moveDown);

		return this.moved;
	};

	exports.Player = Player;
})(typeof global === "undefined" ? window : exports);