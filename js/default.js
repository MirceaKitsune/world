// Default world

// Returns the corresponding floor tile set from this top left corner
function tileset_floor(x, y) {
	return {
		center: [[x + 1, y + 4], [x + 0, y + 0], [x + 1, y + 0], [x + 2, y + 0]],
		single: [[x + 0, y + 1], [x + 0, y + 2]],
		top: [[x + 1, y + 3]],
		bottom: [[x + 1, y + 5]],
		left: [[x + 0, y + 4]],
		right: [[x + 2, y + 4]],
		in_top_left: [[x + 1, y + 1]],
		in_top_right: [[x + 2, y + 1]],
		in_bottom_left: [[x + 1, y + 2]],
		in_bottom_right: [[x + 2, y + 2]],
		out_top_left: [[x + 0, y + 3]],
		out_top_right: [[x + 2, y + 3]],
		out_bottom_left: [[x + 0, y + 5]],
		out_bottom_right: [[x + 2, y + 5]]
	};
}

// Returns the corresponding wall tile set from this top left corner
function tileset_wall(x, y) {
	return {
		single_left: [[x + 0, y + 0]],
		single_center: [[x + 1, y + 0]],
		single_right: [[x + 2, y + 0]],
		center: [[x + 1, y + 2]],
		top: [[x + 1, y + 1]],
		bottom: [[x + 1, y + 3]],
		left: [[x + 0, y + 2]],
		right: [[x + 2, y + 2]],
		top_left: [[x + 0, y + 1]],
		top_right: [[x + 2, y + 1]],
		bottom_left: [[x + 0, y + 3]],
		bottom_right: [[x + 2, y + 3]]
	};
}

const tileset_outdoor_terrain = {
	tileset: "img/tilesets/lpc_terrain.png",
	tilesize: 32,
	scale_x: 32,
	scale_y: 16,
	brushes: [
		{
			density: 0.75,
			layer: 1,
			tiles_floor: tileset_floor(3, 0),
			tiles_wall: tileset_wall(3, 24)
		},
		{
			density: 0.5,
			layer: 2,
			tiles_floor: tileset_floor(0, 0),
			tiles_wall: tileset_wall(3, 24)
		},
		{
			density: 0.25,
			layer: 4,
			tiles_floor: tileset_floor(6, 0),
			tiles_wall: tileset_wall(3, 24)
		}
	]
};

const actor_player = {
	name: "player",
	acceleration: 0.5,
	friction: 0.5,
	idle: 0,
	sprite: {
		sprite: "img/sprites/hero.png",
		scale_x: 24,
		scale_y: 32,
		frames_x: 4,
		frames_y: 4
	}
};

const map_outdoor = {
	tilesets: {
		terrains: [tileset_outdoor_terrain]
	},
	actors: {
		players: [actor_player]
	}
};

register_map("outdoor", map_outdoor);
