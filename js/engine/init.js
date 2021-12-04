// Base directories for different types of data
const PATH_JS = "js/";
const PATH_CSS = "css/";
const PATH_IMAGES = "img/";

// Core files that must be initialized in valid order
const FILES_CSS = ["init.css", "actor.css", "tileset.css", "map.css", "world.css"];
const FILES_JS = ["engine/actor.js", "engine/actor_player.js", "engine/tileset.js", "engine/tileset_terrain.js", "engine/map.js", "engine/world.js"];

// HTML helpers: Creates an element and returns the result
function html_create(type) {
	return document.createElement(type);
}

// HTML helpers: Attaches or detaches an element to or from another element
function html_parent(element, parent, attach) {
	if(attach)
		parent.appendChild(element);
	else
		parent.removeChild(element);
}

// HTML helpers: Sets the text of an element
function html_text(element, text) {
	element.innerHTML = text;
}

// HTML helpers: Sets an attribute on an element
function html_set(element, property, value) {
	element.setAttribute(property, value);
}

// HTML helpers: Unsets an attribute from an element
function html_unset(element, property) {
	element.removeAttribute(property);
}

// HTML helpers: Sets a CSS property on an element style
function html_css(element, property, value) {
	element.style[property] = value;
}

// HTML helpers: Stops a CSS animation, returns undefined for consistency
function html_animation_stop(anim) {
	if(anim)
		anim.cancel();

	return undefined;
}

// HTML helpers: Plays a CSS animation on the given element, returns the new animation
function html_animation_play(element, prop, pos_start, pos_end, duration, steps) {
	const settings = {
		duration: duration * 1000,
		direction: "normal",
		easing: steps ? "steps(" + steps + ")" : "linear",
		iterations: Infinity
	};

	var anim_start = {};
	var anim_end = {};
	anim_start[prop] = px(pos_start);
	anim_end[prop] = px(pos_end);

	return element.animate([anim_start, anim_end], settings);
}

// Includes a group of CSS styles
function include_css(urls) {
	for(let url of urls) {
		const element = html_create("link");
		html_set(element, "rel", "stylesheet");
		html_set(element, "type", "text/css");
		html_set(element, "href", PATH_CSS + url);
		html_parent(element, document.body, true);
	}
}

// Includes a group of JS scripts, each script loads the one after it once it finishes loading
function include_js(urls) {
	var element_last = null;
	for(let url of urls) {
		const element = html_create("script");
		const element_load = function() {html_parent(element, document.body, true)};
		html_set(element, "language", "JavaScript");
		html_set(element, "type", "text/javascript");
		html_set(element, "src", PATH_JS + url);
		element_last ? element_last.onload = element_load : element_load();
		element_last = element;
	}
}

// Loads an image file and returns its element
function load_image(url, onload) {
	loading(true);
	const image = new Image();
	image.src = PATH_IMAGES + url;
	image.onload = function() {
		onload();
		loading(false);
	};
	return image;
}

// Helper: Returns the value of location.search from the URL
function get_search(name) {
	var search = location.search.substring(1).split("=");
	if(name === search[0] && search[1] !== "")
		return search[1];
	return null;
}

// Helper: Returns a random entry if this is an array or the same value if not
function get_random(object) {
	if(typeof object === "object") {
		var index = Math.floor(Math.random() * object.length);
		return object[index];
	}
	return object;
}

// Helper: Returns a random number in a given range
function random_range(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Helper: Returns a vector from an array
function vector(array) {
	return {x: array[0], y: array[1], z: array[2]};
}

// Helper: Converts a velocity to an angle
function vec2ang(vec) {
	// Use the fastest direction when speeds differ, first if they are equal, no change if both are zero
	// Angle, clockwise direction: 0 = top, 1 = right, 2 = bottom, 3 = left
	if(Math.abs(vec.x) > Math.abs(vec.y))
		return vec.x > 0 ? 1 : 3;
	if(Math.abs(vec.y) > Math.abs(vec.x))
		return vec.y > 0 ? 2 : 0;
	if(vec.x != 0)
		return vec.x > 0 ? 1 : 3;
	if(vec.y != 0)
		return vec.y > 0 ? 2 : 0;
	return undefined;
}

// Helper: Returns a pixel string for HTML formatting
function px(pixels) {
	return pixels + "px";
}

// Helper: Returns true if a bounding box intersects another
function intersects(box1, box2) {
	return box1[2] >= box2[0] && box1[3] >= box2[1] && box1[0] <= box2[2] && box1[1] <= box2[3];
}

// Element loading and load progress display
{
	const element_label = html_create("div");
	html_set(element_label, "class", "label");
	html_text(element_label, "Loading...");
	html_parent(element_label, document.body, true);

	var load = load_total = 0;
	function loading(busy) {
		// This function is first called with the busy argument whenever a new asset is included
		// It must then be called without the busy argument once the asset has loaded, typically in its onload function
		if(busy) {
			++load;
			++load_total;
		} else {
			--load;
		}

		// Update the load percentage with how many assets loaded from those that were included
		// Once everything finishes loading we can show the world
		if(load > 0) {
			html_text(element_label, "Loading: " + Math.floor(100 - (load / load_total) * 100) + "%");
		} else {
			world.load();
			html_text(element_label, "");
		}
	}
}

// Include engine code and style files
// The last script is the mod we want to run, extracted from the "mod" tag defined in the HTML
const mod = "mods/" + document.getElementById("mod").getAttribute("name") + "/init.js";
include_css(FILES_CSS);
include_js(FILES_JS.concat([mod]));
