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
