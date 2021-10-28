class TilesetTerrain extends Tileset {
	// Returns noise at a given 2D position
	noise(x, y, seed) {
		return Math.abs(Math.sin(((1 + x) / (1 + y)) * seed));
	}

	// Sets a floor terrain tile
	generate_floor_tile(layer, x, y, brush, type) {
		const tile = {
			tile: get_random(brush.tiles_floor[type])
		};
		this.tile_set(layer, x, y, tile);
	}

	// Generates a floor on the given layer
	generate_floor(layer, brush, seed) {
		for(let x = 0; x < this.data.scale_x; x++) {
			for(let y = 0; y < this.data.scale_y; y++) {
				if(this.noise(x, y, seed) <= brush.density) {
					// Neighbors are stored in an array, clockwise direction starting from the top-left corner:
					// 0 = top left, 1 = top, 2 = top right, 3 = righ, 4 = bottom right, 5 = bottom, 6 = bottom left, 7 = left

					// Get neighbor positions
					const pos = [
						vector([x - 1, y - 1]),
						vector([x, y - 1]),
						vector([x + 1, y - 1]),
						vector([x + 1, y]),
						vector([x + 1, y + 1]),
						vector([x, y + 1]),
						vector([x - 1, y + 1]),
						vector([x - 1, y])
					];

					// Check which neighbors are valid
					const has = [
						this.noise(pos[0].x, pos[0].y, seed) <= brush.density,
						this.noise(pos[1].x, pos[1].y, seed) <= brush.density,
						this.noise(pos[2].x, pos[2].y, seed) <= brush.density,
						this.noise(pos[3].x, pos[3].y, seed) <= brush.density,
						this.noise(pos[4].x, pos[4].y, seed) <= brush.density,
						this.noise(pos[5].x, pos[5].y, seed) <= brush.density,
						this.noise(pos[6].x, pos[6].y, seed) <= brush.density,
						this.noise(pos[7].x, pos[7].y, seed) <= brush.density
					];

					// Set the tile based on our neighbors
					if(has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "center");
					else if(!has[1] && !has[3] && !has[5] && !has[7])
						this.generate_floor_tile(layer, x, y, brush, "single");
					else if(has[0] && has[1] && has[2] && has[3] && has[5] && has[6] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "in_top_left");
					else if(has[0] && has[1] && has[2] && has[3] && has[4] && has[5] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "in_top_right");
					else if(has[1] && has[2] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "in_bottom_right");
					else if(has[0] && has[1] && has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "in_bottom_left");
					else if(has[3] && has[4] && has[5] && has[6] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "top");
					else if(has[0] && has[1] && has[5] && has[6] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "right");
					else if(has[0] && has[1] && has[2] && has[3] && has[7])
						this.generate_floor_tile(layer, x, y, brush, "bottom");
					else if(has[1] && has[2] && has[3] && has[4] && has[5])
						this.generate_floor_tile(layer, x, y, brush, "left");
					else {
						// Corners may overlap and cut through each other, allow multiple ones to be drawn on the same tile
						if(has[3] && has[4] && has[5])
							this.generate_floor_tile(layer, x, y, brush, "out_top_left");
						if(has[5] && has[6] && has[7])
							this.generate_floor_tile(layer, x, y, brush, "out_top_right");
						if(has[0] && has[1] && has[7])
							this.generate_floor_tile(layer, x, y, brush, "out_bottom_right");
						if(has[1] && has[2] && has[3])
							this.generate_floor_tile(layer, x, y, brush, "out_bottom_left");
					}
				}
			}
		}
	}

	// Generator function for terrain
	generate() {
		const brush = this.data.brushes[0];

		// Paint brushes in order
		for(let layer = brush.height_min - 1; layer < brush.height_max; layer++) {
			for(let i = 0; i < brush.iterations; i++) {
				const seed = WORLD_SEED * (layer + 1) * (i + 1);
				this.generate_floor(layer, brush, seed);
			}
		}
	}
}
