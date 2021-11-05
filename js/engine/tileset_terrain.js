// Terrain tile positions as named in the brush definition
const TILE_FLOOR_PATH = "path";
const TILE_FLOOR_CENTER = "center";
const TILE_FLOOR_EDGE_TOP = "edge_top";
const TILE_FLOOR_EDGE_BOTTOM = "edge_bottom";
const TILE_FLOOR_EDGE_LEFT = "edge_left";
const TILE_FLOOR_EDGE_RIGHT = "edge_right";
const TILE_FLOOR_CORNER_IN_TOP_LEFT = "corner_in_top_left";
const TILE_FLOOR_CORNER_IN_TOP_RIGHT = "corner_in_top_right";
const TILE_FLOOR_CORNER_IN_BOTTOM_LEFT = "corner_in_bottom_left";
const TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT = "corner_in_bottom_right";
const TILE_FLOOR_CORNER_OUT_TOP_LEFT = "corner_out_top_left";
const TILE_FLOOR_CORNER_OUT_TOP_RIGHT = "corner_out_top_right";
const TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT = "corner_out_bottom_left";
const TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT = "corner_out_bottom_right";
const TILE_WALL_SINGLE_LEFT = "single_left";
const TILE_WALL_SINGLE_MIDDLE = "single_middle";
const TILE_WALL_SINGLE_RIGHT = "single_right";
const TILE_WALL_LEFT_TOP = "left_top";
const TILE_WALL_LEFT_CENTER = "left_center";
const TILE_WALL_LEFT_BOTTOM = "left_bottom";
const TILE_WALL_MIDDLE_TOP = "middle_top";
const TILE_WALL_MIDDLE_CENTER = "middle_center";
const TILE_WALL_MIDDLE_BOTTOM = "middle_bottom";
const TILE_WALL_RIGHT_TOP = "right_top";
const TILE_WALL_RIGHT_CENTER = "right_center";
const TILE_WALL_RIGHT_BOTTOM = "right_bottom";

class TilesetTerrain extends Tileset {
	// Returns noise at a given 2D position
	noise(x, y, seed) {
		return Math.abs(Math.sin(1 + ((1 + x) / (1 + y)) * seed));
	}

	// Sets a floor tile
	tile_set_floor(layer, x, y, brush, type) {
		this.tile_draw(layer, x, y, get_random(brush.tiles_floor[type]));
		if(type == TILE_FLOOR_CENTER) {
			// Only center tiles need to register collision data
			this.tile_set(layer, x, y, {
				solid: false,
				path: false,
				flags: brush.flags_floor
			});
		}
	}

	// Sets a path tile
	tile_set_path(layer, x, y, brush, length, target) {
		if(brush.path > 0 && this.noise(x, y, layer) <= brush.path) {
			for(let i = layer; i >= layer - length; i--) {
				this.tile_draw(layer, x, y + (layer - i), get_random(brush.tiles_floor[TILE_FLOOR_PATH]));
				this.tile_set(layer, x, y + (layer - i), {
					solid: false,
					path: true,
					flags: brush.flags_floor_path
				});
			}
		}
	}

	// Sets a wall tile
	tile_set_wall(layer, x, y, brush, length, dir) {
		// Extrude the wall downward from the start layer to the end one
		// Direction: -1 = left, 0 = center, +1 = right
		for(let i = layer; i >= layer - length; i--) {
			var type = null;
			if(dir == 0) {
				if(length == 0)
					type = TILE_WALL_SINGLE_MIDDLE;
				else if(i == layer - length)
					type = TILE_WALL_MIDDLE_BOTTOM;
				else if(i == layer)
					type = TILE_WALL_MIDDLE_TOP;
				else
					type = TILE_WALL_MIDDLE_CENTER;
			} else if(dir < 0) {
				if(length == 0)
					type = TILE_WALL_SINGLE_LEFT;
				else if(i == layer - length)
					type = TILE_WALL_LEFT_BOTTOM;
				else if(i == layer)
					type = TILE_WALL_LEFT_TOP;
				else
					type = TILE_WALL_LEFT_CENTER;
			} else if(dir > 0) {
				if(length == 0)
					type = TILE_WALL_SINGLE_RIGHT;
				else if(i == layer - length)
					type = TILE_WALL_RIGHT_BOTTOM;
				else if(i == layer)
					type = TILE_WALL_RIGHT_TOP;
				else
					type = TILE_WALL_RIGHT_CENTER;
			}

			if(type) {
				this.tile_draw(layer, x, y + (layer - i), get_random(brush.tiles_wall[type]));
				if(type == TILE_WALL_SINGLE_MIDDLE || type == TILE_WALL_MIDDLE_TOP || type == TILE_WALL_MIDDLE_CENTER || type == TILE_WALL_MIDDLE_BOTTOM) {
					// Only middle tiles need to register collision data
					this.tile_set(layer, x, y + (layer - i), {
						solid: true,
						path: false,
						flags: brush.flags_wall
					});
				}
			}
		}
	}

	// Returns true if this is a fully surrounded tile
	tile_get_full(layer, x, y, seed, height) {
		if(this.noise(x, y, seed) < height)
			return false;

		const neighbors = this.neighbors(x, y);
		const has = [
			this.noise(neighbors[0].x, neighbors[0].y, seed) >= height,
			this.noise(neighbors[1].x, neighbors[1].y, seed) >= height,
			this.noise(neighbors[2].x, neighbors[2].y, seed) >= height,
			this.noise(neighbors[3].x, neighbors[3].y, seed) >= height,
			this.noise(neighbors[4].x, neighbors[4].y, seed) >= height,
			this.noise(neighbors[5].x, neighbors[5].y, seed) >= height,
			this.noise(neighbors[6].x, neighbors[6].y, seed) >= height,
			this.noise(neighbors[7].x, neighbors[7].y, seed) >= height
		];
		return has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7];
	}

	// Produces terrain using the given brush
	paint(layer_start, layer_end, brush) {
		const seed = WORLD_SEED;
		const height = (1 - brush.density) ** 2;
		for(let x = 0; x < this.scale_x; x++) {
			for(let y = 0; y < this.scale_y + layer_end; y++) {
				// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
				// This offset must include an increase in the loop ranges above as we need to scan beyond layer boundaries
				const draw_x = x;
				const draw_y = y - layer_end;

				const noise_this = this.noise(x, y, layer_end);
				const has_this = this.tile_get_full(layer_end, x, y, seed, height);
				if(has_this) {
					// Draw floor center
					this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CENTER);
				} else {
					const neighbors = this.neighbors(x, y);
					const has = [
						this.tile_get_full(layer_end, neighbors[0].x, neighbors[0].y, seed, height),
						this.tile_get_full(layer_end, neighbors[1].x, neighbors[1].y, seed, height),
						this.tile_get_full(layer_end, neighbors[2].x, neighbors[2].y, seed, height),
						this.tile_get_full(layer_end, neighbors[3].x, neighbors[3].y, seed, height),
						this.tile_get_full(layer_end, neighbors[4].x, neighbors[4].y, seed, height),
						this.tile_get_full(layer_end, neighbors[5].x, neighbors[5].y, seed, height),
						this.tile_get_full(layer_end, neighbors[6].x, neighbors[6].y, seed, height),
						this.tile_get_full(layer_end, neighbors[7].x, neighbors[7].y, seed, height)
					];

					// Draw walls
					if(!has[1] && has[2] && !has[3])
						this.tile_set_wall(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, -1);
					if(has[1])
						this.tile_set_wall(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, 0);
					if(!has[1] && has[0] && !has[7])
						this.tile_set_wall(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, 1);

					// Draw paths
					if(has[4] && has[5] && has[6] && !has[3] && !has[7])
						this.tile_set_path(layer_start, draw_x, draw_y, brush, 0, layer_end);
					if(has[2] && has[3] && has[4] && !has[1] && !has[5])
						this.tile_set_path(layer_start, draw_x, draw_y, brush, 0, layer_end);
					if(has[0] && has[1] && has[2] && !has[3] && !has[7])
						this.tile_set_path(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, layer_end);
					if(has[0] && has[6] && has[7] && !has[1] && !has[5])
						this.tile_set_path(layer_start, draw_x, draw_y, brush, 0, layer_end);

					// Draw floor edges
					if(has[5] && !has[3] && !has[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_TOP);
					if(has[7] && !has[1] && !has[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_RIGHT);
					if(has[1] && !has[3] && !has[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_BOTTOM);
					if(has[3] && !has[1] && !has[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_LEFT);

					// Draw floor inner corners
					if(has[5] && has[7] && !has[1] && !has[3])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_BOTTOM_LEFT);
					if(has[3] && has[5] && !has[1] && !has[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT);
					if(has[1] && has[7] && !has[3] && !has[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_TOP_LEFT);
					if(has[1] && has[3] && !has[5] && !has[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_TOP_RIGHT);

					// Draw floor outer corners
					if(has[0] && !has[1] && !has[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT);
					if(has[2] && !has[1] && !has[3])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT);
					if(has[4] && !has[3] && !has[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_TOP_LEFT);
					if(has[6] && !has[5] && !has[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_TOP_RIGHT);
				}
			}
		}
	}

	// Generator function for terrain
	generate() {
		// Paint the floors and walls of each brush
		// When the next brush is calculated, it takes into account the height of the previous brush for wall height
		var layer_start = 0;
		for(let brush in this.settings.brushes) {
			const data_brush = this.settings.brushes[brush];
			const layer_end = data_brush.layer;
			this.paint(layer_start, layer_end, data_brush);

			// Update the height of this brush if greater than that of the previous brush
			// If lesser then we have a sorting error, abort as a safety measure
			if(layer_end >= layer_start)
				layer_start = layer_end;
			else
				break;
		}
	}
}
