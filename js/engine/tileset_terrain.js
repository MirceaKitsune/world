// Terrain tile positions as named in the brush definition
const TILE_FLOOR_CENTER = "floor_center";
const TILE_FLOOR_EDGE_TOP = "floor_edge_top";
const TILE_FLOOR_EDGE_BOTTOM = "floor_edge_bottom";
const TILE_FLOOR_EDGE_LEFT = "floor_edge_left";
const TILE_FLOOR_EDGE_RIGHT = "floor_edge_right";
const TILE_FLOOR_CORNER_IN_TOP_LEFT = "floor_corner_in_top_left";
const TILE_FLOOR_CORNER_IN_TOP_RIGHT = "floor_corner_in_top_right";
const TILE_FLOOR_CORNER_IN_BOTTOM_LEFT = "floor_corner_in_bottom_left";
const TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT = "floor_corner_in_bottom_right";
const TILE_FLOOR_CORNER_OUT_TOP_LEFT = "floor_corner_out_top_left";
const TILE_FLOOR_CORNER_OUT_TOP_RIGHT = "floor_corner_out_top_right";
const TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT = "floor_corner_out_bottom_left";
const TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT = "floor_corner_out_bottom_right";
const TILE_WALL_LEFT = "wall_left";
const TILE_WALL_MIDDLE = "wall_middle";
const TILE_WALL_RIGHT = "wall_right";

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

	// Produces terrain using the given brush
	paint(layer, height, brush) {
		const layer_floor = layer + height;
		for(let x = 0; x < this.scale.x; x++) {
			for(let y = layer; y < this.scale.y + layer_floor; y++) {
				// To simulate the height of the floor being offset by the wall, the floor layer is subtracted from the y position
				// This must include an offset in the y loop range above as we need to scan beyond layer boundaries
				const draw_x = x;
				const draw_y = y - layer_floor;

				// Handle drawing of terrain tiles
				if(this.noise(x, y, layer_floor, brush)) {
					// Draw floor center
					this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CENTER]);
				} else {
					const neighbors = this.neighbors(x, y);
					const has = [
						this.noise(neighbors[0].x, neighbors[0].y, layer_floor, brush),
						this.noise(neighbors[1].x, neighbors[1].y, layer_floor, brush),
						this.noise(neighbors[2].x, neighbors[2].y, layer_floor, brush),
						this.noise(neighbors[3].x, neighbors[3].y, layer_floor, brush),
						this.noise(neighbors[4].x, neighbors[4].y, layer_floor, brush),
						this.noise(neighbors[5].x, neighbors[5].y, layer_floor, brush),
						this.noise(neighbors[6].x, neighbors[6].y, layer_floor, brush),
						this.noise(neighbors[7].x, neighbors[7].y, layer_floor, brush)
					];
					if(has[0] || has[1] || has[2] || has[3] || has[4] || has[5] || has[6] || has[7]) {
						// Draw walls
						if(brush.tiles[TILE_WALL_LEFT] && brush.tiles[TILE_WALL_MIDDLE] && brush.tiles[TILE_WALL_RIGHT]) {
							if(!has[1] && has[2] && !has[3])
								for(let i = layer; i > layer - height; i--)
									this.tile_set(draw_x, draw_y + (layer - i), layer, brush.tiles[TILE_WALL_LEFT][layer - i]);
							if(has[1])
								for(let i = layer; i > layer - height; i--)
									this.tile_set(draw_x, draw_y + (layer - i), layer, brush.tiles[TILE_WALL_MIDDLE][layer - i]);
							if(!has[1] && has[0] && !has[7])
								for(let i = layer; i > layer - height; i--)
									this.tile_set(draw_x, draw_y + (layer - i), layer, brush.tiles[TILE_WALL_RIGHT][layer - i]);
						}

						// Draw floor edges
						if(has[5] && !has[3] && !has[7])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_EDGE_TOP]);
						if(has[7] && !has[1] && !has[5])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_EDGE_RIGHT]);
						if(has[1] && !has[3] && !has[7])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_EDGE_BOTTOM]);
						if(has[3] && !has[1] && !has[5])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_EDGE_LEFT]);

						// Draw floor inner corners
						if(has[5] && has[7] && !has[1] && !has[3])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_IN_BOTTOM_LEFT]);
						if(has[3] && has[5] && !has[1] && !has[7])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_IN_BOTTOM_RIGHT]);
						if(has[1] && has[7] && !has[3] && !has[5])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_IN_TOP_LEFT]);
						if(has[1] && has[3] && !has[5] && !has[7])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_IN_TOP_RIGHT]);

						// Draw floor outer corners
						if(has[0] && !has[1] && !has[7])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_OUT_BOTTOM_RIGHT]);
						if(has[2] && !has[1] && !has[3])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_OUT_BOTTOM_LEFT]);
						if(has[4] && !has[3] && !has[5])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_OUT_TOP_LEFT]);
						if(has[6] && !has[5] && !has[7])
							this.tile_set(draw_x, draw_y, layer_floor, brush.tiles[TILE_FLOOR_CORNER_OUT_TOP_RIGHT]);
					}
				}
			}
		}
	}

	// Generator function for terrain
	generate() {
		// Paint the floors and walls of each brush
		// When the next brush is calculated, it starts from the height of the previous layer
		// The layer the floor is drawn on is offset by the length of its wall
		var layer = 0;
		for(let brush of this.settings.brushes) {
			const height = brush.tiles[TILE_WALL_LEFT] && brush.tiles[TILE_WALL_MIDDLE] && brush.tiles[TILE_WALL_RIGHT] ? brush.tiles[TILE_WALL_MIDDLE].length : 0;
			this.paint(layer, height, brush);
			if(layer + height > layer)
				layer = layer + height;
		}
	}
}
