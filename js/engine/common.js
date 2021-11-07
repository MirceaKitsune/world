// TODO: Make the seed customizable and predictable
const WORLD_RATE = 1000 / 60; // 60 FPS
const WORLD_SEED = Math.random() * 1000000;
const WORLD_ZOOM = 1;

// Returns a random number in a given range
function random_range(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Returns a vector from an array
function vector(array) {
	return {x: array[0], y: array[1], z: array[2]};
}

// Converts a velocity to an angle
function vec2ang(vec) {
	// Angle, clockwise direction: 0 = top, 1 = right, 2 = bottom, 3 = left
	if(-vec.y > Math.abs(vec.x))
		return 0;
	if(+vec.x > Math.abs(vec.y))
		return 1;
	if(+vec.y > Math.abs(vec.x))
		return 2;
	if(-vec.x > Math.abs(vec.y))
		return 3;
	return undefined;
}

// Returns true if a bounding box intersects another
function intersects(box1, box2) {
	return box1[2] >= box2[0] && box1[3] >= box2[1] && box1[0] <= box2[2] && box1[1] <= box2[3];
}

// Returns a pixel string for HTML formatting
function px(pixels) {
	var s = ""
	for(var i in pixels)
		s += pixels[i] + "px ";
	return s;
}

// Returns the value of location.search from the URL
function get_search(name) {
	var search = location.search.substring(1).split("=");
	if(name === search[0] && search[1] !== "")
		return search[1];
	return null;
}

// Returns a random entry if this is an array or the same value if not
function get_random(object) {
	if(typeof object === "object") {
		var index = Math.floor(Math.random() * object.length);
		return object[index];
	}
	return object;
}

// TODO: Move this to the proper place, possibly directly in index.html
var main = document.createElement("div");
main.setAttribute("class", "main");
document.body.appendChild(main);
