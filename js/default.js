// Default world

// Returns the corresponding floor tile set from this top left corner
function tileset_floor(x, y) {
	return {
		path: [[x + 0, y + 1], [x + 0, y + 2]],
		center: [[x + 1, y + 4], [x + 0, y + 0], [x + 1, y + 0], [x + 2, y + 0]],
		edge_top: [[x + 1, y + 3]],
		edge_bottom: [[x + 1, y + 5]],
		edge_left: [[x + 0, y + 4]],
		edge_right: [[x + 2, y + 4]],
		corner_in_top_left: [[x + 1, y + 1]],
		corner_in_top_right: [[x + 2, y + 1]],
		corner_in_bottom_left: [[x + 1, y + 2]],
		corner_in_bottom_right: [[x + 2, y + 2]],
		corner_out_top_left: [[x + 0, y + 3]],
		corner_out_top_right: [[x + 2, y + 3]],
		corner_out_bottom_left: [[x + 0, y + 5]],
		corner_out_bottom_right: [[x + 2, y + 5]]
	};
}

// Returns the corresponding wall tile set from this top left corner, 1 tile high walls
function tileset_wall_1(x, y) {
	return {
		left: [
			[[x + 0, y + 0]]
		],
		middle: [
			[[x + 1, y + 0]]
		],
		right: [
			[[x + 2, y + 0]]
		]
	};
}

// Returns the corresponding wall tile set from this top left corner, 2 tile high walls
function tileset_wall_2(x, y) {
	return {
		left: [
			[[x + 0, y + 1], [x + 0, y + 3]]
		],
		middle: [
			[[x + 1, y + 1], [x + 1, y + 3]]
		],
		right: [
			[[x + 2, y + 1], [x + 2, y + 3]]
		]
	};
}

// Returns the corresponding wall tile set from this top left corner, 3 tile high walls
function tileset_wall_3(x, y) {
	return {
		left: [
			[[x + 0, y + 1], [x + 0, y + 2], [x + 0, y + 3]]
		],
		middle: [
			[[x + 1, y + 1], [x + 1, y + 2], [x + 1, y + 3]],
			[[x + 1, y + 1], [x + 0, y + 4], [x + 0, y + 5]]
		],
		right: [
			[[x + 2, y + 1], [x + 2, y + 2], [x + 2, y + 3]]
		]
	};
}

// Returns the corresponding wall tile set from this top left corner, 4 tile high walls
function tileset_wall_4(x, y) {
	return {
		left: [
			[[x + 0, y + 1], [x + 0, y + 2], [x + 0, y + 2], [x + 0, y + 3]]
		],
		middle: [
			[[x + 1, y + 1], [x + 1, y + 2], [x + 1, y + 2], [x + 1, y + 3]],
			[[x + 1, y + 1], [x + 1, y + 2], [x + 0, y + 4], [x + 0, y + 5]]
		],
		right: [
			[[x + 2, y + 1], [x + 2, y + 2], [x + 2, y + 2], [x + 2, y + 3]]
		]
	};
}

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
const noise_terrain = function(x, y, layer) {
	if(layer > 1)
		return noise_pattern_terrain(x, y) <= 0.9875 ** layer && noise_pattern_road(x, y) < 0.975;
	else
		return noise_pattern_terrain(x, y) <= 0.9995;
}

// Noise function for road brushes
const noise_road = function(x, y, layer) {
	return noise_pattern_road(x, y) >= 0.7;
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
		stone: 0.5,
		dirt: 0.5,
		grass: 0.625,
		path: 1
	}
};

// Flags for grass brushes
const flags_brush_grass = {
	floor: ["grass", "floor"],
	floor_path: ["grass", "path"],
	wall: ["stone", "wall"]
};

// Flags for dirt brushes
const flags_brush_dirt = {
	floor: ["dirt", "floor", "road"],
	floor_path: ["dirt", "path"],
	wall: ["stone", "wall"]
};

const tileset_outdoor_terrain_1 = {
	image: "img/tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrain, base
		{
			noise: noise_terrain,
			paths: 0,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(3, 0),
			tiles_wall: tileset_wall_1(0, 24)
		},
		// Road
		{
			noise: noise_road,
			paths: 0,
			roads: 0.25,
			flags: flags_brush_dirt,
			tiles_floor: tileset_floor(0, 18),
			tiles_wall: undefined
		},
		// Terrain, 1st island
		{
			noise: noise_terrain,
			paths: 0.5,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(0, 0),
			tiles_wall: tileset_wall_3(0, 24)
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
			noise: noise_terrain,
			paths: 0,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(6, 0),
			tiles_wall: tileset_wall_1(3, 24)
		},
		// Road
		{
			noise: noise_road,
			paths: 0,
			roads: 0.25,
			flags: flags_brush_dirt,
			tiles_floor: tileset_floor(3, 18),
			tiles_wall: undefined
		},
		// Terrain, 1st island
		{
			noise: noise_terrain,
			paths: 0.5,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(6, 0),
			tiles_wall: tileset_wall_3(3, 24)
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
