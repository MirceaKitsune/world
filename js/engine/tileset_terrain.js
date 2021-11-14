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
	noise(x, y, brush) {
		// Returns the noise value at this 2D position, algorithm for floors
		function pattern_floor(tile_x, tile_y) {
			return Math.sin((tile_x + WORLD_SEED) * (tile_y + WORLD_SEED));
		}

		// Returns the noise value at this 2D position, algorithm for roads
		// TODO: This pattern currently generates plain lines, improve it to support intersections and turns for roads
		function pattern_road(tile_x, tile_y) {
			const lines_x = Math.sin(tile_x + WORLD_SEED);
			const lines_y = Math.cos(tile_y + WORLD_SEED);
			return Math.max(lines_x, lines_y);
		}

		// Returns true when the noise level is greater than the amount required for activation
		// The sine is delivered in a -1 to +1 range, squish it into 0 to 1 so we can easily compare against the erosion setting
		// Negative values for the density setting mean we want the opposite pattern, terrain gets eroded where it would normally appear
		// The the density check is squared to correct its range and get the expected amount of terrain for each value
		function height(noise, amount) {
			noise = (1 + noise) / 2;
			amount = amount * Math.abs(amount);
			return amount >= 0 ? noise >= +amount : 1 - noise >= -amount;
		}

		// If this tile reaches the noise requirement, return true if all of its neighbors do too
		// We apply the grid position to the location at which we check noise level so connected maps have a continuous pattern
		x += this.offset.x;
		y += this.offset.y;
		if(height(pattern_floor(x, y), brush.erosion_terrain) && height(pattern_road(x, y), brush.erosion_road)) {
			const neighbors = this.neighbors(x, y);
			if(height(pattern_floor(neighbors[0].x, neighbors[0].y), brush.erosion_terrain) && height(pattern_road(neighbors[0].x, neighbors[0].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[1].x, neighbors[1].y), brush.erosion_terrain) && height(pattern_road(neighbors[1].x, neighbors[1].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[2].x, neighbors[2].y), brush.erosion_terrain) && height(pattern_road(neighbors[2].x, neighbors[2].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[3].x, neighbors[3].y), brush.erosion_terrain) && height(pattern_road(neighbors[3].x, neighbors[3].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[4].x, neighbors[4].y), brush.erosion_terrain) && height(pattern_road(neighbors[4].x, neighbors[4].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[5].x, neighbors[5].y), brush.erosion_terrain) && height(pattern_road(neighbors[5].x, neighbors[5].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[6].x, neighbors[6].y), brush.erosion_terrain) && height(pattern_road(neighbors[6].x, neighbors[6].y), brush.erosion_road))
			if(height(pattern_floor(neighbors[7].x, neighbors[7].y), brush.erosion_terrain) && height(pattern_road(neighbors[7].x, neighbors[7].y), brush.erosion_road))
				return true;
		}
		return false;
	}

	// Sets a floor tile
	tile_set_floor(layer, x, y, brush, type) {
		const tile = get_random(brush.tiles_floor[type]);
		const flags = type == TILE_FLOOR_CENTER ? brush.flags.floor : null;
		this.tile_set(layer, x, y, tile, flags);
	}

	// Sets a path tile
	tile_set_path(layer, x, y, brush, length, target) {
		if(brush.paths >= Math.random()) {
			for(let i = layer; i >= layer - length; i--) {
				const tile = get_random(brush.tiles_floor[TILE_FLOOR_PATH]);
				const flags = brush.flags.floor_path;
				this.tile_set(layer, x, y + (layer - i), tile, flags);
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

			const tile = get_random(brush.tiles_wall[type]);
			const flags = type == TILE_WALL_SINGLE_MIDDLE || type == TILE_WALL_MIDDLE_TOP || type == TILE_WALL_MIDDLE_CENTER || type == TILE_WALL_MIDDLE_BOTTOM ? brush.flags.wall : null;
			this.tile_set(layer, x, y + (layer - i), tile, flags);
		}
	}

	// Produces terrain using the given brush
	paint(layer_start, layer_end, brush) {
		for(let x = 0; x < this.scale.x; x++) {
			for(let y = layer_start; y < this.scale.y + layer_end; y++) {
				// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
				// This must include an offset in the y loop range above as we need to scan beyond layer boundaries
				const draw_x = x;
				const draw_y = y - layer_end;

				// Handle drawing of terrain tiles
				if(this.noise(x, y, brush)) {
					// Draw floor center
					this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CENTER);
				} else {
					const neighbors = this.neighbors(x, y);
					const has = [
						this.noise(neighbors[0].x, neighbors[0].y, brush),
						this.noise(neighbors[1].x, neighbors[1].y, brush),
						this.noise(neighbors[2].x, neighbors[2].y, brush),
						this.noise(neighbors[3].x, neighbors[3].y, brush),
						this.noise(neighbors[4].x, neighbors[4].y, brush),
						this.noise(neighbors[5].x, neighbors[5].y, brush),
						this.noise(neighbors[6].x, neighbors[6].y, brush),
						this.noise(neighbors[7].x, neighbors[7].y, brush)
					];
					if(has[0] || has[1] || has[2] || has[3] || has[4] || has[5] || has[6] || has[7]) {
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
