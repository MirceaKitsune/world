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

	// Sets a terrain floor tile
	generate_terrain_set_tile_floor(layer, x, y, brush, type) {
		// Register collisions if this is a solid tile
		var collisions = [false, false, false, false];
		if(brush.solid) {
			// 0 = top, 1 = right, 2 = bottom, 3 = left
			if(type == TILE_FLOOR_TOP || type == TILE_FLOOR_IN_TOP_LEFT || type == TILE_FLOOR_IN_TOP_RIGHT)
				collisions[0] = true;
			if(type == TILE_FLOOR_RIGHT || type == TILE_FLOOR_IN_TOP_RIGHT || type == TILE_FLOOR_IN_BOTTOM_RIGHT)
				collisions[1] = true;
			if(type == TILE_FLOOR_BOTTOM || type == TILE_FLOOR_IN_BOTTOM_LEFT || type == TILE_FLOOR_IN_BOTTOM_RIGHT)
				collisions[2] = true;
			if(type == TILE_FLOOR_LEFT || type == TILE_FLOOR_IN_TOP_LEFT || type == TILE_FLOOR_IN_BOTTOM_LEFT)
				collisions[3] = true;
		}

		// Draw the tile
		const tile = {
			tile: get_random(brush.tiles_floor[type]),
			collisions: collisions
		};
		this.tile_set(layer, x, y, tile);
	}

	// Sets a terrain wall tile
	generate_terrain_set_tile_wall(layer, x, y, brush, length, dir) {
		// The length must allow at least enough space to place a top and bottom wall tile
		if(!brush.solid || length < 1)
			return;

		// Extrude the wall downward from the start layer to the end one
		// Direction: -1 = left, 0 = center, +1 = right
		for(let i = layer; i >= layer - length; i--) {
			var type = null;
			if(dir == 0) {
				if(i == layer - length)
					type = TILE_WALL_BOTTOM;
				else if(i == layer)
					type = TILE_WALL_TOP;
				else
					type = TILE_WALL_CENTER;
			} else if(dir < 0) {
				if(i == layer - length)
					type = TILE_WALL_BOTTOM_LEFT;
				else if(i == layer)
					type = TILE_WALL_TOP_LEFT;
				else
					type = TILE_WALL_LEFT;
			} else if(dir > 0) {
				if(i == layer - length)
					type = TILE_WALL_BOTTOM_RIGHT;
				else if(i == layer)
					type = TILE_WALL_TOP_RIGHT;
				else
					type = TILE_WALL_RIGHT;
			}

			// Draw the tile
			if(type) {
				const tile = {
					tile: get_random(brush.tiles_wall[type]),
					collisions: [true, true, true, true]
				};
				this.tile_set(layer, x, y + (layer - i), tile);
			}
		}
	}

	// Returns true if this is a fully surrounded tile
	generate_terrain_get_tile_full(layer, x, y, seed, height) {
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

	// Generates terrain on the given layer
	generate_terrain(layer_start, layer_end, brush) {
		const seed = WORLD_SEED;
		for(let x = 0; x < this.data.scale_x; x++) {
			for(let y = 0; y < this.data.scale_y + layer_end; y++) {
				if(this.noise(x, y, seed) >= brush.height) {
					// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
					// This offset must include an increase in the loop ranges above as we need to scan beyond layer boundaries
					const draw_x = x;
					const draw_y = y - layer_end;

					// Check which neighbors are valid
					const neighbors = this.neighbors(x, y);
					const has_this = this.generate_terrain_get_tile_full(layer_end, x, y, seed, brush.height);
					const has = [
						this.generate_terrain_get_tile_full(layer_end, neighbors[0].x, neighbors[0].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[1].x, neighbors[1].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[2].x, neighbors[2].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[3].x, neighbors[3].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[4].x, neighbors[4].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[5].x, neighbors[5].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[6].x, neighbors[6].y, seed, brush.height),
						this.generate_terrain_get_tile_full(layer_end, neighbors[7].x, neighbors[7].y, seed, brush.height)
					];

					if(has_this) {
						// Draw floor center
						this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_CENTER);
					} else {
						// Draw walls
						if(!has[1] && has[2])
							this.generate_terrain_set_tile_wall(layer_end, draw_x, draw_y, brush, layer_end - layer_start - 1, -1);
						if(has[1])
							this.generate_terrain_set_tile_wall(layer_end, draw_x, draw_y, brush, layer_end - layer_start - 1, 0);
						if(!has[1] && has[0])
							this.generate_terrain_set_tile_wall(layer_end, draw_x, draw_y, brush, layer_end - layer_start - 1, 1);

						// Draw floor edges
						if(has[5] && !has[3] && !has[7])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_TOP);
						if(has[7] && !has[1] && !has[5])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_RIGHT);
						if(has[1] && !has[3] && !has[7])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_BOTTOM);
						if(has[3] && !has[1] && !has[5])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_LEFT);

						// Draw floor inner corners
						if(has[5] && has[7] && !has[1] && !has[3])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_IN_BOTTOM_LEFT);
						if(has[3] && has[5] && !has[1] && !has[7])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_IN_BOTTOM_RIGHT);
						if(has[1] && has[7] && !has[3] && !has[5])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_IN_TOP_LEFT);
						if(has[1] && has[3] && !has[5] && !has[7])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_IN_TOP_RIGHT);

						// Draw floor outer corners
						if(has[0] && !has[1] && !has[7])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_OUT_BOTTOM_RIGHT);
						if(has[2] && !has[1] && !has[3])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_OUT_BOTTOM_LEFT);
						if(has[4] && !has[3] && !has[5])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_OUT_TOP_LEFT);
						if(has[6] && !has[5] && !has[7])
							this.generate_terrain_set_tile_floor(layer_end, draw_x, draw_y, brush, TILE_FLOOR_OUT_TOP_RIGHT);
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
			const brush_layer = Math.floor(brush_data.height * this.data.layers);
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
