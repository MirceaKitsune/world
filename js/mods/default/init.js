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

// Load the scripts for the default mod
include_js(["mods/default/tileset_lpc.js", "mods/default/mod.js"]);
