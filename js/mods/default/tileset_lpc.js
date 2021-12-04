// Noise function for terrain brushes
// Islands above layer 1 get rarer with height and must avoid the road
const lpc_noise_terrain = function(x, y, layer) {
	if(layer > 1)
		return noise_terrain(x, y) <= 0.9875 ** layer && noise_road(x, y) < 0.975;
	else
		return noise_terrain(x, y) <= 0.9995;
}

// Noise function for road brushes
const lpc_noise_road = function(x, y, layer) {
	return noise_road(x, y) >= 0.7;
}

// Noise function for floor tiles, 1st set
const lpc_noise_tile_floor_25 = function(x, y, layer) {
	const noise = noise_terrain(x, y);
	return noise > 0 && noise <= 0.25;
}

// Noise function for floor tiles, 2nd set
const lpc_noise_tile_floor_50 = function(x, y, layer) {
	const noise = noise_terrain(x, y);
	return noise > 0.25 && noise <= 0.5;
}

// Noise function for floor tiles, 3rd set
const lpc_noise_tile_floor_75 = function(x, y, layer) {
	const noise = noise_terrain(x, y);
	return noise > 0.5 && noise <= 0.75;
}

// Noise function for floor tiles, 4th set
const lpc_noise_tile_floor_100 = function(x, y, layer) {
	const noise = noise_terrain(x, y);
	return noise > 0.75 && noise <= 1;
}

// Noise function for path tiles, 1st set
const lpc_noise_tile_path_1 = function(x, y, layer) {
	const noise = noise_terrain(x, y);
	return noise > 0 && noise <= 0.05;
}

// Noise function for path tiles, 2nd set
const lpc_noise_tile_path_2 = function(x, y, layer) {
	const noise = noise_terrain(x, y);
	return noise > 0.05 && noise <= 0.1;
}

// Noise function for cave tiles, draws the cave
// To keep the choice persistent per column, y position must be fixed, else we may get only one piece of a cave spawned
// TODO: Find a pattern that still randomizes based on height but without cutting cave entrances
const lpc_noise_tile_cave_true = function(x, y, layer) {
	return noise_terrain(x, 0) <= 0.05;
}

// Noise function for cave tiles, skips the cave
// To keep the choice persistent per column, y position must be fixed, else we may get only one piece of a cave spawned
// TODO: Find a pattern that still randomizes based on height but without cutting cave entrances
const lpc_noise_tile_cave_false = function(x, y, layer) {
	return noise_terrain(x, 0) > 0.05;
}

// Returns the corresponding tile set from this top left corner
function lpc_tileset(pos_floor, pos_wall, flags, height, cliff) {
	var tiles = {};

	// Set the floor tiles
	const floor_x = pos_floor[0];
	const floor_y = pos_floor[1];
	const flags_floor = flags.concat([cliff ? "solid" : "floor"]);
	const flags_path = flags.concat([cliff ? "solid" : height > 0 ? "path" : "gravel"]);
	tiles.floor_center = [
		{x: floor_x + 1, y: floor_y + 4, flags: flags_floor, noise: lpc_noise_tile_floor_25},
		{x: floor_x + 0, y: floor_y + 0, flags: flags_floor, noise: lpc_noise_tile_floor_50},
		{x: floor_x + 1, y: floor_y + 0, flags: flags_floor, noise: lpc_noise_tile_floor_75},
		{x: floor_x + 2, y: floor_y + 0, flags: flags_floor, noise: lpc_noise_tile_floor_100}
	];
	tiles.floor_edge_top = [
		{x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: lpc_noise_tile_path_1},
		{x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: lpc_noise_tile_path_2},
		{x: floor_x + 1, y: floor_y + 3}
	];
	tiles.floor_edge_bottom = [
		// {x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: lpc_noise_tile_path_1},
		// {x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: lpc_noise_tile_path_2},
		{x: floor_x + 1, y: floor_y + 5}
	];
	tiles.floor_edge_left = [
		{x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: lpc_noise_tile_path_1},
		{x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: lpc_noise_tile_path_2},
		{x: floor_x + 0, y: floor_y + 4}
	];
	tiles.floor_edge_right = [
		{x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: lpc_noise_tile_path_1},
		{x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: lpc_noise_tile_path_2},
		{x: floor_x + 2, y: floor_y + 4}
	];
	tiles.floor_corner_in_top_left = [{x: floor_x + 1, y: floor_y + 1}];
	tiles.floor_corner_in_top_right = [{x: floor_x + 2, y: floor_y + 1}];
	tiles.floor_corner_in_bottom_left = [{x: floor_x + 1, y: floor_y + 2}];
	tiles.floor_corner_in_bottom_right = [{x: floor_x + 2, y: floor_y + 2}];
	tiles.floor_corner_out_top_left = [{x: floor_x + 0, y: floor_y + 3}];
	tiles.floor_corner_out_top_right = [{x: floor_x + 2, y: floor_y + 3}];
	tiles.floor_corner_out_bottom_left = [{x: floor_x + 0, y: floor_y + 5}];
	tiles.floor_corner_out_bottom_right = [{x: floor_x + 2, y: floor_y + 5}];

	// Set the wall tiles
	const wall_x = pos_wall[0];
	const wall_y = pos_wall[1];
	const flags_wall = flags.concat(["wall"]);
	const flags_cave = flags.concat(["cave", cliff ? "cave_out" : "cave_in"]);
	if(height >= 4) {
		// Configuration for a 4 tile tall wall
		tiles.wall_left = [
			[{x: wall_x + 0, y: wall_y + 1}],
			[{x: wall_x + 0, y: wall_y + 2}],
			[{x: wall_x + 0, y: wall_y + 2}],
			[{x: wall_x + 0, y: wall_y + 3}]
		];
		tiles.wall_middle = [
			[{x: wall_x + 1, y: wall_y + 1, flags:flags_wall}],
			[{x: wall_x + 1, y: wall_y + 2, flags:flags_wall}],
			[{x: wall_x + 1, y: wall_y + 2, flags:flags_wall, noise: lpc_noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 4, flags:flags_wall, noise: lpc_noise_tile_cave_true}],
			[{x: wall_x + 1, y: wall_y + 3, flags:flags_wall, noise: lpc_noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 5, flags:flags_cave, noise: lpc_noise_tile_cave_true}],
		];
		tiles.wall_right = [
			[{x: wall_x + 2, y: wall_y + 1}],
			[{x: wall_x + 2, y: wall_y + 2}],
			[{x: wall_x + 2, y: wall_y + 2}],
			[{x: wall_x + 2, y: wall_y + 3}]
		];
	} else if(height >= 3) {
		// Configuration for a 3 tile tall wall
		tiles.wall_left = [
			[{x: wall_x + 0, y: wall_y + 1}],
			[{x: wall_x + 0, y: wall_y + 2}],
			[{x: wall_x + 0, y: wall_y + 3}]
		];
		tiles.wall_middle = [
			[{x: wall_x + 1, y: wall_y + 1, flags:flags_wall}],
			[{x: wall_x + 1, y: wall_y + 2, flags:flags_wall, noise: lpc_noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 4, flags:flags_wall, noise: lpc_noise_tile_cave_true}],
			[{x: wall_x + 1, y: wall_y + 3, flags:flags_wall, noise: lpc_noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 5, flags:flags_cave, noise: lpc_noise_tile_cave_true}],
		];
		tiles.wall_right = [
			[{x: wall_x + 2, y: wall_y + 1}],
			[{x: wall_x + 2, y: wall_y + 2}],
			[{x: wall_x + 2, y: wall_y + 3}]
		];
	} else if(height >= 2) {
		// Configuration for a 2 tile tall wall
		tiles.wall_left = [
			[{x: wall_x + 0, y: wall_y + 1}],
			[{x: wall_x + 0, y: wall_y + 3}]
		];
		tiles.wall_middle = [
			[{x: wall_x + 1, y: wall_y + 1, flags:flags_wall}],
			[{x: wall_x + 1, y: wall_y + 3, flags:flags_wall}]
		];
		tiles.wall_right = [
			[{x: wall_x + 2, y: wall_y + 1}],
			[{x: wall_x + 2, y: wall_y + 3}]
		];
	} else if(height >= 1) {
		// Configuration for a 1 tile tall wall
		tiles.wall_left = [
			[{x: wall_x + 0, y: wall_y + 0}]
		];
		tiles.wall_middle = [
			[{x: wall_x + 1, y: wall_y + 0, flags:flags_wall}]
		];
		tiles.wall_right = [
			[{x: wall_x + 2, y: wall_y + 0}]
		]
	}

	return tiles;
}
