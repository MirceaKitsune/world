// Default world

// Noise algorithm for terrains, ranges 0 to 1
function noise_pattern_terrain(x, y) {
	const noise = Math.sin((x + WORLD_SEED) * (y + WORLD_SEED));
	return (1 + noise) / 2;
}

// Noise algorithm for roads, ranges 0 to 1
function noise_pattern_road(x, y) {
	const noise_x = Math.sin(x + WORLD_SEED);
	const noise_y = Math.cos(y + WORLD_SEED);
	const noise = Math.max(noise_x, noise_y);
	return (1 + noise) / 2;
}

// Noise function for terrain brushes
// Islands above layer 1 get rarer with height and must avoid the road
const noise_brush_terrain = function(x, y, layer) {
	if(layer > 1)
		return noise_pattern_terrain(x, y) <= 0.9875 ** layer && noise_pattern_road(x, y) < 0.975;
	else
		return noise_pattern_terrain(x, y) <= 0.9995;
}

// Noise function for road brushes
const noise_brush_road = function(x, y, layer) {
	return noise_pattern_road(x, y) >= 0.7;
}

// Noise function for floor tiles, 1st set
const noise_tile_floor_25 = function(x, y, layer) {
	const noise = noise_pattern_terrain(x, y);
	return noise > 0 && noise <= 0.25;
}

// Noise function for floor tiles, 2nd set
const noise_tile_floor_50 = function(x, y, layer) {
	const noise = noise_pattern_terrain(x, y);
	return noise > 0.25 && noise <= 0.5;
}

// Noise function for floor tiles, 3rd set
const noise_tile_floor_75 = function(x, y, layer) {
	const noise = noise_pattern_terrain(x, y);
	return noise > 0.5 && noise <= 0.75;
}

// Noise function for floor tiles, 4th set
const noise_tile_floor_100 = function(x, y, layer) {
	const noise = noise_pattern_terrain(x, y);
	return noise > 0.75 && noise <= 1;
}

// Noise function for path tiles, 1st set
const noise_tile_path_1 = function(x, y, layer) {
	const noise = noise_pattern_terrain(x, y);
	return noise > 0 && noise <= 0.05;
}

// Noise function for path tiles, 2nd set
const noise_tile_path_2 = function(x, y, layer) {
	const noise = noise_pattern_terrain(x, y);
	return noise > 0.05 && noise <= 0.1;
}

// Noise function for cave tiles, draws the cave
// To keep the choice persistent per column, y position must be fixed, else we may get only one piece of a cave spawned
// TODO: Find a pattern that still randomizes based on height but without cutting cave entrances
const noise_tile_cave_true = function(x, y, layer) {
	return noise_pattern_terrain(x, 0) <= 0.05;
}

// Noise function for cave tiles, skips the cave
// To keep the choice persistent per column, y position must be fixed, else we may get only one piece of a cave spawned
// TODO: Find a pattern that still randomizes based on height but without cutting cave entrances
const noise_tile_cave_false = function(x, y, layer) {
	return noise_pattern_terrain(x, 0) > 0.05;
}

// Returns the corresponding tile set from this top left corner
function tileset_terrain(pos_floor, pos_wall, flags, height) {
	var tiles = {};

	// Set the floor tiles
	const floor_x = pos_floor[0];
	const floor_y = pos_floor[1];
	const flags_floor = flags.concat(flags, ["floor"]);
	const flags_path = flags.concat(flags, ["path"]);
	tiles.floor_center = [
		{x: floor_x + 1, y: floor_y + 4, flags: flags_floor, noise: noise_tile_floor_25},
		{x: floor_x + 0, y: floor_y + 0, flags: flags_floor, noise: noise_tile_floor_50},
		{x: floor_x + 1, y: floor_y + 0, flags: flags_floor, noise: noise_tile_floor_75},
		{x: floor_x + 2, y: floor_y + 0, flags: flags_floor, noise: noise_tile_floor_100}
	];
	tiles.floor_edge_top = [
		{x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: noise_tile_path_1},
		{x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: noise_tile_path_2},
		{x: floor_x + 1, y: floor_y + 3}
	];
	tiles.floor_edge_bottom = [
		// {x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: noise_tile_path_1},
		// {x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: noise_tile_path_2},
		{x: floor_x + 1, y: floor_y + 5}
	];
	tiles.floor_edge_left = [
		{x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: noise_tile_path_1},
		{x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: noise_tile_path_2},
		{x: floor_x + 0, y: floor_y + 4}
	];
	tiles.floor_edge_right = [
		{x: floor_x + 0, y: floor_y + 1, flags: flags_path, noise: noise_tile_path_1},
		{x: floor_x + 0, y: floor_y + 2, flags: flags_path, noise: noise_tile_path_2},
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
	const flags_wall = flags.concat(flags, ["wall"]);
	const flags_cave = flags.concat(flags, ["cave"]);
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
			[{x: wall_x + 1, y: wall_y + 2, flags:flags_wall, noise: noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 4, flags:flags_wall, noise: noise_tile_cave_true}],
			[{x: wall_x + 1, y: wall_y + 3, flags:flags_wall, noise: noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 5, flags:flags_cave, noise: noise_tile_cave_true}],
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
			[{x: wall_x + 1, y: wall_y + 2, flags:flags_wall, noise: noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 4, flags:flags_wall, noise: noise_tile_cave_true}],
			[{x: wall_x + 1, y: wall_y + 3, flags:flags_wall, noise: noise_tile_cave_false}, {x: wall_x + 0, y: wall_y + 5, flags:flags_cave, noise: noise_tile_cave_true}],
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

// Overlays for outdoor map
const overlays_outdoor = [
	{
		image: "img/backgrounds/clouds.png",
		scale: 512,
		top: false,
		scroll_x: 50,
		scroll_y: 0
	},
	{
		color: "#4fdfffef",
		top: false
	}
];

// Flags for character actors
const flags_actor_character = {
	spawn: {
		dirt: 1
	},
	solid: {
		wall: 1
	},
	path: {
		path: 1
	},
	road: {
		road: 1
	},
	friction: {
		path: 1,
		cave: 0.5,
		grass: 0.625,
		dirt: 0.5,
		stone: 0.5
	}
};

const tileset_outdoor_terrain_1 = {
	image: "img/tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrain, base
		{
			noise: noise_brush_terrain,
			tiles: tileset_terrain([3, 0], [0, 24], ["grass", "terrain"], 1)
		},
		// Road
		{
			noise: noise_brush_road,
			tiles: tileset_terrain([0, 18], [0, 24], ["dirt", "road"], 0)
		},
		// Terrain, 1st island
		{
			noise: noise_brush_terrain,
			tiles: tileset_terrain([0, 0], [0, 24], ["grass", "terrain"], 3)
		}
	]
};

const tileset_outdoor_terrain_2 = {
	image: "img/tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrain, base
		{
			noise: noise_brush_terrain,
			tiles: tileset_terrain([6, 0], [3, 24], ["grass", "terrain"], 1)
		},
		// Road
		{
			noise: noise_brush_road,
			tiles: tileset_terrain([3, 18], [3, 24], ["dirt", "road"], 0)
		},
		// Terrain, 1st island
		{
			noise: noise_brush_terrain,
			tiles: tileset_terrain([6, 0], [3, 24], ["grass", "terrain"], 3)
		}
	]
};

const map_outdoor_1 = {
	temp_min: -1,
	temp_max: 0,
	perspective: 0.1,
	bound: true,
	overlays: overlays_outdoor,
	tileset: tileset_outdoor_terrain_1
};

const map_outdoor_2 = {
	temp_min: 0,
	temp_max: 1,
	perspective: 0.1,
	bound: true,
	overlays: overlays_outdoor,
	tileset: tileset_outdoor_terrain_2
};

const map_group_outdoor = {
	scale_x: 1024,
	scale_y: 1024,
	maps_x: 4,
	maps_y: 4,
	height: 0,
	maps: ["outdoor_1", "outdoor_2"]
}

const actor_player = {
	acceleration: 0.5,
	anim_moving: 1,
	anim_static: 0,
	box: [-8, -8, 8, 8],
	flags: flags_actor_character,
	sprite: {
		image: "img/sprites/hero.png",
		scale_x: 24,
		scale_y: 32,
		frames_x: 4,
		frames_y: 4
	}
};

world.register_data_map("outdoor_1", map_outdoor_1);
world.register_data_map("outdoor_2", map_outdoor_2);
world.register_data_actor("player", actor_player);
world.spawn_map_group(map_group_outdoor);
world.spawn_actor_player("player");
