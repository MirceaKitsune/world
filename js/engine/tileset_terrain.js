class TilesetTerrain extends Tileset {
	// Returns noise at a given 2D position
	noise(x, y, seed) {
		return Math.abs(Math.sin(((1 + x) / (1 + y)) * seed));
	}

	// Sets a terrain tile
	generate_terrain_tile(layer, x, y, brush, type) {
		// Determine if this is a solid tile and preform additional actions if so
		// The layer must be above 1 or there isn't any space to place at least a top and bottom wall tile
		if(brush.solid && layer > 1) {
			// Set border collisions for floor tiles, clockwise direction:
			// 0 = top, 1 = right, 2 = bottom, 3 = left
			var collisions = [false, false, false, false];
			if(type == "top" || type == "in_top_left" || type == "in_top_right")
				collisions[0] = true; // Top
			if(type == "right" || type == "in_top_right" || type == "in_bottom_right")
				collisions[1] = true; // Right
			if(type == "bottom" || type == "in_bottom_left" || type == "in_bottom_right")
				collisions[2] = true; // Bottom
			if(type == "left" || type == "in_top_left" || type == "in_bottom_left")
				collisions[3] = true; // Left

			// If this is a bottom tile, extrude the wall downward from the current layer
			for(let l = layer; l >= 0; l--) {
				var type_wall = null;
				if(type == "bottom" || type == "in_top_left" || type == "in_top_right") {
					if(l == 0)
						type_wall = "top";
					else if(l == layer - 1)
						type_wall = "bottom";
					else
						type_wall = "center";
				} else if(type == "out_bottom_left") {
					if(l == 0)
						type_wall = "top_left";
					else if(l == layer - 1)
						type_wall = "bottom_left";
					else
						type_wall = "left";
				} else if(type == "out_bottom_right") {
					if(l == 0)
						type_wall = "top_right";
					else if(l == layer - 1)
						type_wall = "bottom_right";
					else
						type_wall = "right";
				}

				// Draw the wall tile
				if(type_wall) {
					const tile_wall = {
						tile: get_random(brush.tiles_wall[type_wall]),
						collisions: [true, true, true, true]
					};
					this.tile_set(layer, x, y + l, tile_wall);
				}
			}
		}

		// Draw the floor tile
		const tile_floor = {
			tile: get_random(brush.tiles_floor[type]),
			collisions: collisions
		};
		this.tile_set(layer, x, y, tile_floor);
	}

	// Generates terrain on the given layer
	generate_terrain(layer, brush, seed) {
		for(let x = 0; x < this.data.scale_x; x++) {
			for(let y = 0; y < this.data.scale_y; y++) {
				if(this.noise(x, y, seed) <= brush.density) {
					// Neighbors are stored in an array, clockwise direction starting from the top-left corner:
					// 0 = top left, 1 = top, 2 = top right, 3 = righ, 4 = bottom right, 5 = bottom, 6 = bottom left, 7 = left

					// Check which neighbors are valid
					const neighbors = this.neighbors(x, y);
					const has = [
						this.noise(neighbors[0].x, neighbors[0].y, seed) <= brush.density,
						this.noise(neighbors[1].x, neighbors[1].y, seed) <= brush.density,
						this.noise(neighbors[2].x, neighbors[2].y, seed) <= brush.density,
						this.noise(neighbors[3].x, neighbors[3].y, seed) <= brush.density,
						this.noise(neighbors[4].x, neighbors[4].y, seed) <= brush.density,
						this.noise(neighbors[5].x, neighbors[5].y, seed) <= brush.density,
						this.noise(neighbors[6].x, neighbors[6].y, seed) <= brush.density,
						this.noise(neighbors[7].x, neighbors[7].y, seed) <= brush.density
					];

					// Set the tile based on our neighbors
					if(has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "center");
					else if(!has[1] && !has[3] && !has[5] && !has[7])
						this.generate_terrain_tile(layer, x, y, brush, "single");
					else if(has[0] && has[1] && has[2] && has[3] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "in_top_left");
					else if(has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "in_top_right");
					else if(has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "in_bottom_right");
					else if(has[0] && has[1] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "in_bottom_left");
					else if(has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "top");
					else if(has[0] && has[1] && has[5] && has[6] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "right");
					else if(has[0] && has[1] && has[2] && has[3] && has[7])
						this.generate_terrain_tile(layer, x, y, brush, "bottom");
					else if(has[1] && has[2] && has[3] && has[4] && has[5])
						this.generate_terrain_tile(layer, x, y, brush, "left");
					else {
						// Corners may overlap and cut through each other, allow multiple ones to be drawn on the same tile
						if(has[3] && has[4] && has[5])
							this.generate_terrain_tile(layer, x, y, brush, "out_top_left");
						if(has[5] && has[6] && has[7])
							this.generate_terrain_tile(layer, x, y, brush, "out_top_right");
						if(has[0] && has[1] && has[7])
							this.generate_terrain_tile(layer, x, y, brush, "out_bottom_right");
						if(has[1] && has[2] && has[3])
							this.generate_terrain_tile(layer, x, y, brush, "out_bottom_left");
					}
				}
			}
		}
	}

	// Generator function for terrain
	generate() {
		// Paint the floors of this brush
		for(let layer in this.layers) {
			for(let brush in this.data.brushes) {
				const brush_data = this.data.brushes[brush];
				if(layer >= brush_data.height_min - 1 && layer <= brush_data.height_max - 1) {
					for(let i = 0; i < brush_data.iterations; i++) {
						const seed = WORLD_SEED * (brush + 1) * (layer + 1) * (i + 1);
						this.generate_terrain(layer, brush_data, seed);
					}
				}
			}
		}
	}
}
