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
	// Returns noise at a given 2D position, algorithm for terrain floors
	noise_floor(x, y, seed) {
		return Math.abs(Math.sin(1 + ((1 + x) / (1 + y)) * seed));
	}

	// Returns noise at a given 2D position, algorithm for terrain roads
	noise_road(x, y, seed) {
		// TODO: This pattern currently only generates lines, improve it to support intersections and turns for roads
		const lines_x = Math.abs(Math.sin(x + seed));
		const lines_y = Math.abs(Math.cos(y + seed));
		return (lines_x + lines_y) / 2;
	}

	// Returns true if this is a fully surrounded floor tile
	noise_floor_surrounded(layer, x, y, seed, height) {
		if(this.noise_floor(x, y, seed) < height)
			return false;

		const neighbors = this.neighbors(x, y);
		const has = [
			this.noise_floor(neighbors[0].x, neighbors[0].y, seed) >= height,
			this.noise_floor(neighbors[1].x, neighbors[1].y, seed) >= height,
			this.noise_floor(neighbors[2].x, neighbors[2].y, seed) >= height,
			this.noise_floor(neighbors[3].x, neighbors[3].y, seed) >= height,
			this.noise_floor(neighbors[4].x, neighbors[4].y, seed) >= height,
			this.noise_floor(neighbors[5].x, neighbors[5].y, seed) >= height,
			this.noise_floor(neighbors[6].x, neighbors[6].y, seed) >= height,
			this.noise_floor(neighbors[7].x, neighbors[7].y, seed) >= height
		];
		return has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7];
	}

	// Sets a road tile
	tile_set_road(layer, x, y, brush, type) {
		const tile = get_random(brush.tiles_road[type]);
		const flags = brush.flags.road;
		this.tile_set(layer, x, y, tile, flags);
	}

	// Sets a floor tile
	tile_set_floor(layer, x, y, brush, type) {
		const tile = get_random(brush.tiles_floor[type]);
		const flags = type == TILE_FLOOR_CENTER ? brush.flags.floor : null;
		this.tile_set(layer, x, y, tile, flags);
	}

	// Sets a path tile
	tile_set_path(layer, x, y, brush, length, target) {
		for(let i = layer; i >= layer - length; i--) {
			const tile = get_random(brush.tiles_floor[TILE_FLOOR_PATH]);
			const flags = brush.flags.floor_path;
			this.tile_set(layer, x, y + (layer - i), tile, flags);
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
		const seed = WORLD_SEED;
		const height = (1 - brush.density) ** 2;
		if(!brush.tiles_floor)
			return;

		for(let x = 0; x < this.scale_x; x++) {
			for(let y = 0; y < this.scale_y + layer_end; y++) {
				// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
				// This offset must include an increase in the loop ranges above as we need to scan beyond layer boundaries
				const draw_x = x;
				const draw_y = y - layer_end;

				// Determine which noise levels this tile and its neighbors meet
				// Terrain tiles need to be surrounded on all sides to be valid, road ones don't but may only appear over the brush's floors
				const neighbors = this.neighbors(x, y);
				const has_this_floor = this.noise_floor_surrounded(layer_end, x, y, seed, height);
				const has_this_road = has_this_floor && this.noise_road(x, y, seed) >= 1 - brush.roads;
				const has_floor = [
					this.noise_floor_surrounded(layer_end, neighbors[0].x, neighbors[0].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[1].x, neighbors[1].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[2].x, neighbors[2].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[3].x, neighbors[3].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[4].x, neighbors[4].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[5].x, neighbors[5].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[6].x, neighbors[6].y, seed, height),
					this.noise_floor_surrounded(layer_end, neighbors[7].x, neighbors[7].y, seed, height)
				];
				const has_road = [
					has_floor[0] && this.noise_road(neighbors[0].x, neighbors[0].y, seed) >= 1 - brush.roads,
					has_floor[1] && this.noise_road(neighbors[1].x, neighbors[1].y, seed) >= 1 - brush.roads,
					has_floor[2] && this.noise_road(neighbors[2].x, neighbors[2].y, seed) >= 1 - brush.roads,
					has_floor[3] && this.noise_road(neighbors[3].x, neighbors[3].y, seed) >= 1 - brush.roads,
					has_floor[4] && this.noise_road(neighbors[4].x, neighbors[4].y, seed) >= 1 - brush.roads,
					has_floor[5] && this.noise_road(neighbors[5].x, neighbors[5].y, seed) >= 1 - brush.roads,
					has_floor[6] && this.noise_road(neighbors[6].x, neighbors[6].y, seed) >= 1 - brush.roads,
					has_floor[7] && this.noise_road(neighbors[7].x, neighbors[7].y, seed) >= 1 - brush.roads
				];

				// Handle drawing of terrain tiles
				if(has_this_floor) {
					// Draw floor center
					this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CENTER);
				} else {
					// Draw walls
					if(brush.tiles_wall) {
						if(!has_floor[1] && has_floor[2] && !has_floor[3])
							this.tile_set_wall(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, -1);
						if(has_floor[1])
							this.tile_set_wall(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, 0);
						if(!has_floor[1] && has_floor[0] && !has_floor[7])
							this.tile_set_wall(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, 1);
					}

					// Draw paths
					// Paths appear where an island intersects a road
					if(has_this_road || has_road[1] || has_road[3] || has_road[5] || has_road[7]) {
						if(has_floor[4] && has_floor[5] && has_floor[6] && !has_floor[3] && !has_floor[7])
							this.tile_set_path(layer_start, draw_x, draw_y, brush, 0, layer_end);
						if(has_floor[2] && has_floor[3] && has_floor[4] && !has_floor[1] && !has_floor[5])
							this.tile_set_path(layer_start, draw_x, draw_y, brush, 0, layer_end);
						if(has_floor[0] && has_floor[1] && has_floor[2] && !has_floor[3] && !has_floor[7])
							this.tile_set_path(layer_start, draw_x, draw_y, brush, layer_end - layer_start - 1, layer_end);
						if(has_floor[0] && has_floor[6] && has_floor[7] && !has_floor[1] && !has_floor[5])
							this.tile_set_path(layer_start, draw_x, draw_y, brush, 0, layer_end);
					}

					// Draw floor edges
					if(has_floor[5] && !has_floor[3] && !has_floor[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_TOP);
					if(has_floor[7] && !has_floor[1] && !has_floor[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_RIGHT);
					if(has_floor[1] && !has_floor[3] && !has_floor[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_BOTTOM);
					if(has_floor[3] && !has_floor[1] && !has_floor[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_LEFT);

					// Draw floor inner corners
					if(has_floor[5] && has_floor[7] && !has_floor[1] && !has_floor[3])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_BOTTOM_LEFT);
					if(has_floor[3] && has_floor[5] && !has_floor[1] && !has_floor[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT);
					if(has_floor[1] && has_floor[7] && !has_floor[3] && !has_floor[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_TOP_LEFT);
					if(has_floor[1] && has_floor[3] && !has_floor[5] && !has_floor[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_TOP_RIGHT);

					// Draw floor outer corners
					if(has_floor[0] && !has_floor[1] && !has_floor[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT);
					if(has_floor[2] && !has_floor[1] && !has_floor[3])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT);
					if(has_floor[4] && !has_floor[3] && !has_floor[5])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_TOP_LEFT);
					if(has_floor[6] && !has_floor[5] && !has_floor[7])
						this.tile_set_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_TOP_RIGHT);
				}

				// Handle drawing of road tiles
				if(brush.roads > 0 && brush.tiles_road && has_this_road) {
					// Set the road tile based on our neighbors
					// We use a different pattern from the floor as small structures are allowed and not everything needs a full center tile
					if(has_road[0] && has_road[1] && has_road[2] && has_road[3] && has_road[4] && has_road[5] && has_road[6] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CENTER);
					else if(!has_road[1] && !has_road[3] && !has_road[5] && !has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_PATH);
					else if(has_road[0] && has_road[1] && has_road[2] && has_road[3] && has_road[5] && has_road[6] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_TOP_LEFT);
					else if(has_road[0] && has_road[1] && has_road[2] && has_road[3] && has_road[4] && has_road[5] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_TOP_RIGHT);
					else if(has_road[1] && has_road[2] && has_road[3] && has_road[4] && has_road[5] && has_road[6] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT);
					else if(has_road[0] && has_road[1] && has_road[3] && has_road[4] && has_road[5] && has_road[6] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_IN_BOTTOM_LEFT);
					else if(has_road[3] && has_road[4] && has_road[5] && has_road[6] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_TOP);
					else if(has_road[0] && has_road[1] && has_road[5] && has_road[6] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_RIGHT);
					else if(has_road[0] && has_road[1] && has_road[2] && has_road[3] && has_road[7])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_BOTTOM);
					else if(has_road[1] && has_road[2] && has_road[3] && has_road[4] && has_road[5])
						this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_EDGE_LEFT);
					else {
						// Corners may overlap and cut through each other, allow multiple ones to be drawn on the same tile
						if(has_road[3] && has_road[4] && has_road[5])
							this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_TOP_LEFT);
						if(has_road[5] && has_road[6] && has_road[7])
							this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_TOP_RIGHT);
						if(has_road[0] && has_road[1] && has_road[7])
							this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT);
						if(has_road[1] && has_road[2] && has_road[3])
							this.tile_set_road(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT);
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
