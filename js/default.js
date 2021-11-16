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

// Returns the corresponding wall tile set from this top left corner
function tileset_wall(x, y) {
	return {
		single_left: [[x + 0, y + 0]],
		single_middle: [[x + 1, y + 0]],
		single_right: [[x + 2, y + 0]],
		left_top: [[x + 0, y + 1]],
		left_center: [[x + 0, y + 2]],
		left_bottom: [[x + 0, y + 3]],
		middle_top: [[x + 1, y + 1]],
		middle_center: [[x + 1, y + 2]],
		middle_bottom: [[x + 1, y + 3]],
		right_top: [[x + 2, y + 1]],
		right_center: [[x + 2, y + 2]],
		right_bottom: [[x + 2, y + 3]]
	};
}

// Noise algorithm for terrain brushes
const noise_terrain = function(x, y) {
	return Math.sin((x + WORLD_SEED) * (y + WORLD_SEED));
}

// Noise algorithm for road brushes
const noise_road = function(x, y) {
	const noise_x = Math.sin(x + WORLD_SEED);
	const noise_y = Math.cos(y + WORLD_SEED);
	return Math.max(noise_x, noise_y);
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
		// Terrains
		{
			noise: [{func: noise_terrain, val: 0.05}],
			paths: 0,
			layer: 1,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(3, 0),
			tiles_wall: tileset_wall(0, 24)
		},
		{
			noise: [{func: noise_terrain, val: 0.1}, {func: noise_road, val: -0.175}],
			paths: 0.5,
			layer: 2,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(0, 0),
			tiles_wall: tileset_wall(0, 24)
		},

		// Roads
		{
			noise: [{func: noise_terrain, val: 0.05}, {func: noise_road, val: 0.825}],
			paths: 0,
			layer: 1,
			roads: 0.25,
			flags: flags_brush_dirt,
			tiles_floor: tileset_floor(0, 18),
			tiles_wall: tileset_wall(0, 24)
		}
	]
};

const tileset_outdoor_terrain_2 = {
	image: "img/tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrains
		{
			noise: [{func: noise_terrain, val: 0.05}],
			paths: 0,
			layer: 1,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(6, 0),
			tiles_wall: tileset_wall(3, 24)
		},
		{
			noise: [{func: noise_terrain, val: 0.1}, {func: noise_road, val: -0.175}],
			paths: 0.5,
			layer: 2,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(6, 0),
			tiles_wall: tileset_wall(3, 24)
		},

		// Roads
		{
			noise: [{func: noise_terrain, val: 0.05}, {func: noise_road, val: 0.825}],
			paths: 0,
			layer: 1,
			roads: 0.25,
			flags: flags_brush_dirt,
			tiles_floor: tileset_floor(3, 18),
			tiles_wall: tileset_wall(3, 24)
		}
	]
};

const map_outdoor_1 = {
	temp_min: -1,
	temp_max: 0,
	perspective: 0.1,
	bound: true,
	overlays: overlays_outdoor,
	tilesets: {
		terrains: [tileset_outdoor_terrain_1]
	}
};

const map_outdoor_2 = {
	temp_min: 0,
	temp_max: 1,
	perspective: 0.1,
	bound: true,
	overlays: overlays_outdoor,
	tilesets: {
		terrains: [tileset_outdoor_terrain_2]
	}
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
