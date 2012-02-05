(function(exports) {

	var Player = function(id, x, y) {
		this.id = id || -1;
		this.nick = 'Guest'+ this.id;
		this.x = x || 0;
		this.y = y || 0;
		
		this.isAlive = true;
		this.HP = 100;
		this.lastMove = Date.now();
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
	};

	Player.prototype.toString = function() { 
		return /*this.id +' '+ */this.nick +' '+ this.x +':'+ this.y + this.ping +'ms';
	};

	Player.prototype.draw = function(ctx) {
		ctx.fillRect(this.x, this.y, this.width, this.height);
	};

	Player.prototype.hasMoved = function() {
		this.moved = (this.moveLeft || this.moveRight || this.moveUp || this.moveDown);
			
		return this.moved;
	};

	exports.Player = Player;
})(typeof global === "undefined" ? window : exports);