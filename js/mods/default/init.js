// Noise algorithm for terrains, ranges 0 to 1
function noise_terrain(x, y) {
	const noise = Math.sin((x + WORLD_SEED) * (y + WORLD_SEED));
	return (1 + noise) / 2;
}

// Noise algorithm for roads, ranges 0 to 1
function noise_road(x, y) {
	const noise_x = Math.sin(x + WORLD_SEED);
	const noise_y = Math.cos(y + WORLD_SEED);
	const noise = Math.max(noise_x, noise_y);
	return (1 + noise) / 2;
}

// Brush overlays, background
const overlay_background = {
	image: "backgrounds/clouds.png",
	color: "#4fdfff",
	alpha: 1,
	scale: 16,
	scroll_x: 50,
	scroll_y: 0,
	fixed: -1
};

// Brush overlays, foreground
const overlay_foreground = {
	image: "backgrounds/clouds_shadow.png",
	alpha: 0.1,
	scale: 16,
	scroll_x: 100,
	scroll_y: 0,
	fixed: 0
};

// Brush overlays, cave background
const overlay_background_cave = {
	color: "#0f0f0f",
	alpha: 1,
	fixed: -1
};

// Brush overlays, cave foreground
const overlay_foreground_cave = {};

// Load the scripts for the default mod
include_js(["mods/default/tileset_lpc.js", "mods/default/map_plains.js", "mods/default/map_forest.js", "mods/default/map.js", "mods/default/actor_player.js"]);
