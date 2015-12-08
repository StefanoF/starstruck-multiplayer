/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, startF) {
	var x = startX,
		y = startY,
		f = startF,
		id;

	// Getters and setters
	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};

	var getF = function() {
		return f;
	};

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};

	var setF = function(newF) {
		f = newF;
	};

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		getF: getF,
		setX: setX,
		setY: setY,
		setF: setF,
		id: id
	}
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;