// Terrain tile positions as named in the brush definition
const TILE_FLOOR_CENTER = "center";
const TILE_FLOOR_SINGLE = "single";
const TILE_FLOOR_TOP = "top";
const TILE_FLOOR_BOTTOM = "bottom";
const TILE_FLOOR_LEFT = "left";
const TILE_FLOOR_RIGHT = "right";
const TILE_FLOOR_IN_TOP_LEFT = "in_top_left";
const TILE_FLOOR_IN_TOP_RIGHT = "in_top_right";
const TILE_FLOOR_IN_BOTTOM_LEFT = "in_bottom_left";
const TILE_FLOOR_IN_BOTTOM_RIGHT = "in_bottom_right";
const TILE_FLOOR_OUT_TOP_LEFT = "out_top_left";
const TILE_FLOOR_OUT_TOP_RIGHT = "out_top_right";
const TILE_FLOOR_OUT_BOTTOM_LEFT = "out_bottom_left";
const TILE_FLOOR_OUT_BOTTOM_RIGHT = "out_bottom_right";
const TILE_WALL_CENTER = "center";
const TILE_WALL_TOP = "top";
const TILE_WALL_BOTTOM = "bottom";
const TILE_WALL_LEFT = "left";
const TILE_WALL_RIGHT = "right";
const TILE_WALL_TOP_LEFT = "top_left";
const TILE_WALL_TOP_RIGHT = "top_right";
const TILE_WALL_BOTTOM_LEFT = "bottom_left";
const TILE_WALL_BOTTOM_RIGHT = "bottom_right";

class TilesetTerrain extends Tileset {
	// Returns noise at a given 2D position
	noise(x, y, seed) {
		return Math.abs(Math.sin(((1 + x) / (1 + y)) * seed));
	}

	// Sets a terrain tile
	generate_terrain_tile(layer_start, layer_end, x, y, brush, type) {
		var collisions_floor = [false, false, false, false];

		// Determine if this is a solid tile and preform additional actions if so
		// The layer must be above 1 or there isn't any space to place at least a top and bottom wall tile
		if(brush.solid && layer_end - layer_start > 1) {
			// Set border collisions for floor tiles, clockwise direction:
			// 0 = top, 1 = right, 2 = bottom, 3 = left
			if(type == TILE_FLOOR_TOP || type == TILE_FLOOR_IN_TOP_LEFT || type == TILE_FLOOR_IN_TOP_RIGHT)
				collisions_floor[0] = true;
			if(type == TILE_FLOOR_RIGHT || type == TILE_FLOOR_IN_TOP_RIGHT || type == TILE_FLOOR_IN_BOTTOM_RIGHT)
				collisions_floor[1] = true;
			if(type == TILE_FLOOR_BOTTOM || type == TILE_FLOOR_IN_BOTTOM_LEFT || type == TILE_FLOOR_IN_BOTTOM_RIGHT)
				collisions_floor[2] = true;
			if(type == TILE_FLOOR_LEFT || type == TILE_FLOOR_IN_TOP_LEFT || type == TILE_FLOOR_IN_BOTTOM_LEFT)
				collisions_floor[3] = true;

			// If this is a bottom tile, extrude the wall downward from the current layer
			for(let i = layer_end; i >= layer_start; i--) {
				var type_wall = null;
				if(type == TILE_FLOOR_BOTTOM || type == TILE_FLOOR_IN_TOP_LEFT || type == TILE_FLOOR_IN_TOP_RIGHT) {
					if(i == layer_start)
						type_wall = TILE_WALL_BOTTOM;
					else if(i == layer_end)
						type_wall = TILE_WALL_TOP;
					else
						type_wall = TILE_WALL_CENTER;
				} else if(type == TILE_FLOOR_OUT_BOTTOM_LEFT) {
					if(i == layer_start)
						type_wall = TILE_WALL_BOTTOM_LEFT;
					else if(i == layer_end)
						type_wall = TILE_WALL_TOP_LEFT;
					else
						type_wall = TILE_WALL_LEFT;
				} else if(type == TILE_FLOOR_OUT_BOTTOM_RIGHT) {
					if(i == layer_start)
						type_wall = TILE_WALL_BOTTOM_RIGHT;
					else if(i == layer_end)
						type_wall = TILE_WALL_TOP_RIGHT;
					else
						type_wall = TILE_WALL_RIGHT;
				}

				// Draw the wall tile
				if(type_wall) {
					const tile_wall = {
						tile: get_random(brush.tiles_wall[type_wall]),
						collisions: [true, true, true, true]
					};
					this.tile_set(layer_end, x, y + (layer_end - i), tile_wall);
				}
			}
		}

		// Draw the floor tile
		const tile_floor = {
			tile: get_random(brush.tiles_floor[type]),
			collisions: collisions_floor
		};
		this.tile_set(layer_end, x, y, tile_floor);
	}

	// Generates terrain on the given layer
	generate_terrain(layer_start, layer_end, brush) {
		const seed = WORLD_SEED;
		for(let x = 0; x < this.data.scale_x; x++) {
			for(let y = 0; y < this.data.scale_y; y++) {
				// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
				if(this.noise(x, y - layer_end, seed) >= brush.height) {
					// Neighbors are stored in an array, clockwise direction starting from the top-left corner:
					// 0 = top left, 1 = top, 2 = top right, 3 = righ, 4 = bottom right, 5 = bottom, 6 = bottom left, 7 = left

					// Check which neighbors are valid
					const neighbors = this.neighbors(x, y);
					const has = [
						this.noise(neighbors[0].x, neighbors[0].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[1].x, neighbors[1].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[2].x, neighbors[2].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[3].x, neighbors[3].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[4].x, neighbors[4].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[5].x, neighbors[5].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[6].x, neighbors[6].y - layer_end, seed) >= brush.height,
						this.noise(neighbors[7].x, neighbors[7].y - layer_end, seed) >= brush.height
					];

					// Set the tile based on our neighbors
					if(has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_CENTER);
					else if(!has[1] && !has[3] && !has[5] && !has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_SINGLE);
					else if(has[0] && has[1] && has[2] && has[3] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_IN_TOP_LEFT);
					else if(has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_IN_TOP_RIGHT);
					else if(has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_IN_BOTTOM_RIGHT);
					else if(has[0] && has[1] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_IN_BOTTOM_LEFT);
					else if(has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_TOP);
					else if(has[0] && has[1] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_RIGHT);
					else if(has[0] && has[1] && has[2] && has[3] && has[7])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_BOTTOM);
					else if(has[1] && has[2] && has[3] && has[4] && has[5])
						this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_LEFT);
					else {
						// Corners may overlap and cut through each other, allow multiple ones to be drawn on the same tile
						if(has[3] && has[4] && has[5])
							this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_OUT_TOP_LEFT);
						if(has[5] && has[6] && has[7])
							this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_OUT_TOP_RIGHT);
						if(has[0] && has[1] && has[7])
							this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_OUT_BOTTOM_RIGHT);
						if(has[1] && has[2] && has[3])
							this.generate_terrain_tile(layer_start, layer_end, x, y, brush, TILE_FLOOR_OUT_BOTTOM_LEFT);
					}
				}
			}
		}
	}

	// Generator function for terrain
	generate() {
		// Paint the floors of this brush
		// The height of the brush is squished to the nearest available layer
		// When the next brush is calculated, it takes into account the height of the previous brush for walls
		var last_layer = 0;
		for(let brush in this.data.brushes) {
			const brush_data = this.data.brushes[brush];
			const brush_layer = Math.floor(brush_data.height * this.layers.length);
			this.generate_terrain(last_layer, brush_layer, brush_data);

			// Update the height of this brush if greater than that of the previous brush
			// If lesser then we have a sorting error, abort as a safety measure
			if(brush_layer >= last_layer)
				last_layer = brush_layer;
			else
				break;
		}
	}
}
