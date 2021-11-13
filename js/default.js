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
	floor: ["dirt", "floor"],
	floor_path: ["dirt", "path"],
	wall: ["stone", "wall"]
};

const tileset_outdoor_terrain = {
	image: "img/tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrains
		{
			erosion_terrain: 0.05,
			erosion_road: 0,
			paths: 0,
			layer: 1,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(3, 0),
			tiles_wall: tileset_wall(3, 24)
		},
		{
			erosion_terrain: 0.1,
			erosion_road: -0.25,
			paths: 0.5,
			layer: 2,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(0, 0),
			tiles_wall: tileset_wall(3, 24)
		},
		{
			erosion_terrain: 0.5,
			erosion_road: -0.25,
			paths: 0.25,
			layer: 4,
			flags: flags_brush_grass,
			tiles_floor: tileset_floor(6, 0),
			tiles_wall: tileset_wall(3, 24)
		},

		// Roads
		{
			erosion_terrain: 0.05,
			erosion_road: 0.75,
			paths: 0,
			layer: 1,
			roads: 0.25,
			flags: flags_brush_dirt,
			tiles_floor: tileset_floor(0, 18),
			tiles_wall: tileset_wall(3, 24)
		}
	]
};

const map_outdoor = {
	name: "outdoor",
	scale_x: 1024,
	scale_y: 1024,
	perspective: 0.25,
	bound: true,
	overlays: overlays_outdoor,
	tilesets: {
		terrains: [tileset_outdoor_terrain]
	}
};

const actor_player = {
	name: "player",
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

world([map_outdoor], [], actor_player);
