// Returns the corresponding floor tile set from this top left corner
function tileset_floor(left, top) {
	const x = left * 3;
	const y = top * 6;
	return {
		center: [[x + 1, y + 4], [x + 0, y + 0], [x + 1, y + 0], [x + 2, y + 0]],
		single: [[x + 0, y + 1], [x + 0, y + 2]],
		top: [[x + 1, y + 3]],
		right: [[x + 2, y + 4]],
		bottom: [[x + 1, y + 5]],
		left: [[x + 0, y + 4]],
		out_top_left: [[x + 0, y + 3]],
		out_top_right: [[x + 2, y + 3]],
		out_bottom_right: [[x + 2, y + 5]],
		out_bottom_left: [[x + 0, y + 5]],
		in_top_left: [[x + 1, y + 1]],
		in_top_right: [[x + 2, y + 1]],
		in_bottom_left: [[x + 1, y + 2]],
		in_bottom_right: [[x + 2, y + 2]]
	};
}

const tileset_outdoor_terrain = {
	tileset: "img/tilesets/lpc_terrain.png",
	tilesize: 32,
	layers: 2,
	scale_x: 32,
	scale_y: 16,
	brushes: [
		{
			density: 0.95,
			iterations: 1,
			height_min: 1,
			height_max: 2,
			tiles_floor: tileset_floor(1, 0),
			tiles_wall: {}
		}
	]
};

const map_outdoor = {
	tilesets: {
		terrains: [tileset_outdoor_terrain]
	}
};

register_map("outdoor", map_outdoor);
