var Fps = function(time) {
	this.time = time;
	this.handle = null;
	this.count = 0;
	this.timer = null;
	this.lastFps = 0;
};

Fps.prototype.init = function(handle) {
	this.handle = handle;
	this.startTimer();
};
	
Fps.prototype.update = function() {
	this.lastFps = this.count / (this.time / 1000);
	this.count = 0;
	this.handle.html(this.lastFps +'fps');
};

Fps.prototype.startTimer = function() {
	var that = this;
	this.timer = setTimeout(function() {
		that.update();
		that.startTimer();
	}, this.time); 
};