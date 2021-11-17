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
	// Returns true if this is a fully surrounded tile based on the appropriate noise levels
	noise(x, y, layer, brush) {
		// We apply the grid position to the location at which we check noise level so connected maps have a continuous pattern
		x += this.offset.x;
		y += this.offset.y;

		// This tile must test positive for the noise check
		if(!brush.noise(x, y, layer))
			return false;

		// The neighbors of this tile must test positive for the noise check
		const neighbors = this.neighbors(x, y);
		for(let neighbor of neighbors)
			if(!brush.noise(neighbor.x, neighbor.y, layer))
				return false;

		// All checks passed, this is a valid tile we can draw to
		return true;
	}

	// Sets a floor tile
	tile_set_floor(x, y, layer, brush, type) {
		const tile = get_random(brush.tiles_floor[type]);
		const flags = type == TILE_FLOOR_CENTER ? brush.flags.floor : null;
		this.tile_set(layer, x, y, tile, flags);
	}

	// Sets a path tile
	tile_set_path(x, y, layer, brush, length, target) {
		for(let i = layer; i >= layer - length; i--) {
			const tile = get_random(brush.tiles_floor[TILE_FLOOR_PATH]);
			const flags = brush.flags.floor_path;
			this.tile_set(layer, x, y + (layer - i), tile, flags);
		}
	}

	// Sets a wall tile
	tile_set_wall(x, y, layer, brush, length, dir) {
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

			const tile = get_random(brush.tiles_wall[type]);
			const flags = type == TILE_WALL_SINGLE_MIDDLE || type == TILE_WALL_MIDDLE_TOP || type == TILE_WALL_MIDDLE_CENTER || type == TILE_WALL_MIDDLE_BOTTOM ? brush.flags.wall : null;
			this.tile_set(layer, x, y + (layer - i), tile, flags);
		}
	}

	// Produces terrain using the given brush
	paint(layer_start, layer_end, brush) {
		if(!brush.tiles_floor)
			return;

		for(let x = 0; x < this.scale.x; x++) {
			for(let y = layer_start; y < this.scale.y + layer_end; y++) {
				// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
				// This must include an offset in the y loop range above as we need to scan beyond layer boundaries
				const draw_x = x;
				const draw_y = y - layer_end;

				// Handle drawing of terrain tiles
				if(this.noise(x, y, layer_end, brush)) {
					// Draw floor center
					this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CENTER);
				} else {
					const neighbors = this.neighbors(x, y);
					const has = [
						this.noise(neighbors[0].x, neighbors[0].y, layer_end, brush),
						this.noise(neighbors[1].x, neighbors[1].y, layer_end, brush),
						this.noise(neighbors[2].x, neighbors[2].y, layer_end, brush),
						this.noise(neighbors[3].x, neighbors[3].y, layer_end, brush),
						this.noise(neighbors[4].x, neighbors[4].y, layer_end, brush),
						this.noise(neighbors[5].x, neighbors[5].y, layer_end, brush),
						this.noise(neighbors[6].x, neighbors[6].y, layer_end, brush),
						this.noise(neighbors[7].x, neighbors[7].y, layer_end, brush)
					];
					if(has[0] || has[1] || has[2] || has[3] || has[4] || has[5] || has[6] || has[7]) {
						// Draw walls
						if(brush.tiles_wall) {
							if(!has[1] && has[2] && !has[3])
								this.tile_set_wall(draw_x, draw_y, layer_start, brush, layer_end - layer_start - 1, -1);
							if(has[1])
								this.tile_set_wall(draw_x, draw_y, layer_start, brush, layer_end - layer_start - 1, 0);
							if(!has[1] && has[0] && !has[7])
								this.tile_set_wall(draw_x, draw_y, layer_start, brush, layer_end - layer_start - 1, 1);
						}

						// Draw paths
						if(brush.paths > Math.random()) {
							if(has[4] && has[5] && has[6] && !has[3] && !has[7])
								this.tile_set_path(draw_x, draw_y, layer_start, brush, 0, layer_end);
							if(has[2] && has[3] && has[4] && !has[1] && !has[5])
								this.tile_set_path(draw_x, draw_y, layer_start, brush, 0, layer_end);
							if(has[0] && has[1] && has[2] && !has[3] && !has[7])
								this.tile_set_path(draw_x, draw_y, layer_start, brush, layer_end - layer_start - 1, layer_end);
							if(has[0] && has[6] && has[7] && !has[1] && !has[5])
								this.tile_set_path(draw_x, draw_y, layer_start, brush, 0, layer_end);
						}

						// Draw floor edges
						if(has[5] && !has[3] && !has[7])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_EDGE_TOP);
						if(has[7] && !has[1] && !has[5])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_EDGE_RIGHT);
						if(has[1] && !has[3] && !has[7])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_EDGE_BOTTOM);
						if(has[3] && !has[1] && !has[5])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_EDGE_LEFT);

						// Draw floor inner corners
						if(has[5] && has[7] && !has[1] && !has[3])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_IN_BOTTOM_LEFT);
						if(has[3] && has[5] && !has[1] && !has[7])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT);
						if(has[1] && has[7] && !has[3] && !has[5])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_IN_TOP_LEFT);
						if(has[1] && has[3] && !has[5] && !has[7])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_IN_TOP_RIGHT);

						// Draw floor outer corners
						if(has[0] && !has[1] && !has[7])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT);
						if(has[2] && !has[1] && !has[3])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT);
						if(has[4] && !has[3] && !has[5])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_OUT_TOP_LEFT);
						if(has[6] && !has[5] && !has[7])
							this.tile_set_floor(draw_x, draw_y, layer_end, brush, TILE_FLOOR_CORNER_OUT_TOP_RIGHT);
					}
				}
			}
		}
	}

	// Generator function for terrain
	generate() {
		// Paint the floors and walls of each brush
		// When the next brush is calculated, it takes into account the height of the previous layer for wall height
		var layer_start = 0;
		var layer_end = 0;
		for(let brush of this.settings.brushes) {
			if(brush.layer > layer_end) {
				layer_start = layer_end;
				layer_end = brush.layer;
			}
			this.paint(layer_start, layer_end, brush);
		}
	}
}
