var Viewport = function(width, height) {
	width = width;
	height = height;
	x = 0;
	y = 0;

	getCenter = function() {
		return {
			x: x,
			y: y
		};
	};

	// Center viewport on given coords
	setCenter = function(_x, _y) {
		x = _x - (width / 2);
		y = _y - (height / 2);
	};

	// Check if coords are inside viewport + safety range
	isInsideRange = function(_x, _y, _rangeX, _rangeY) {
		if (((_x >= -_rangeX) && (_x < _width + _rangeX)) &&
			((_y >= -_rangeY) && (_y < _height + _rangeY))) {
			return true;
		}

		return false;
	};

	// Check if coords are inside viewport
	// useful to check clicks on canvas
	isInside = function(_x, _y) {
		return isInsideRange(_x, _y, 0, 0);
	};

	getSize = function() {
		return {
			width: width,
			height: height
		};
	};

	// Resize viewport to given size
	// Useful when resizing a full screen viewport
	setSize = function(_width, _height) {
		width = _width;
		height = _height;
	};

	return {
		getCenter: getCenter,
		setCenter: setCenter,
		isInsideRange: isInsideRange,
		isInside: isInside,
		getSize: getSize,
		setSize: setSize
	};

};