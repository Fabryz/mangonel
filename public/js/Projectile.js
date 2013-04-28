(function(exports) {

	var Projectile = function(x, y, angle, owner) {
        this.x = x || 0;
        this.y = y || 0;
        this.angle = angle || 0;
        this.angularVelocity = 0;
        this.dtl = 0;

        this.owner = owner || null;
        this.createdAt = Date.now();
        this.id = this.owner + this.createdAt;

        this.width = 10;
        this.height = 5;

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    };

	Projectile.prototype.toString = function() {
		return this.owner +' '+ this.x +':'+ this.y +' '+ this.angle +'°';
	};

	exports.Projectile = Projectile;
})(typeof global === "undefined" ? window : exports);