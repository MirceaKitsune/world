class Tileset {
	constructor(map, settings) {
		// Tilesets are spawned by the Map class and have an instance as their parent
		this.map = map;
		this.settings = settings;

		// Objects that store layer data and the HTML elements of layers
		this.layers = [];
		this.layers_element = [];

		// Set the scale of the tilemap so that it covers the range indicated by the parent
		// The noise offset is the position of the map on the world grid
		this.scale = {
			x: Math.ceil(this.map.scale.x / this.settings.size),
			y: Math.ceil(this.map.scale.y / this.settings.size)
		};
		this.offset = {
			x: this.map.grid.x * this.map.scale.x,
			y: this.map.grid.y * this.map.scale.y
		};

		// Create the tileset element and append it to the parent element
		this.image = load_image(this.settings.image, this.onload.bind(this));
		this.element = html_create("div");
		html_set(this.element, "class", "tileset");
		html_css(this.element, "width", px([this.scale.x * this.settings.size]));
		html_css(this.element, "height", px([this.scale.y * this.settings.size]));
		html_parent(this.element, this.map.element_view, true);
	}

	// Generates features when the tileset is loaded, must be replaced by child classes
	generate() {}

	// Executed when the tileset image finishes loading, calls the generator function
	onload() {
		this.generate();
	}

	// Returns neighbor positions relative to x and y
	neighbors(x, y) {
		// Neighbors are stored in an array, clockwise direction starting from the top-left corner:
		// 0 = top left, 1 = top, 2 = top right, 3 = righ, 4 = bottom right, 5 = bottom, 6 = bottom left, 7 = left
		return [
			vector([x - 1, y - 1]),
			vector([x, y - 1]),
			vector([x + 1, y - 1]),
			vector([x + 1, y]),
			vector([x + 1, y + 1]),
			vector([x, y + 1]),
			vector([x - 1, y + 1]),
			vector([x - 1, y])
		];
	}

	// Attaches a group of overlay elements to the map or layer
	overlay_set(layer, overlays) {
		for(let overlay of overlays) {
			const element_overlay = html_create("div");
			html_set(element_overlay, "class", "tileset_overlay");
			html_css(element_overlay, "opacity", overlay.alpha);
			html_css(element_overlay, "backgroundColor", overlay.color);
			html_css(element_overlay, "zIndex", overlay.fixed == 0 ? layer : overlay.fixed);
			html_parent(element_overlay, overlay.fixed == 0 ? this.element : this.map.element, true);

			// Prepare and configure the background image of this overlay if one is defined
			if(overlay.image) {
				const scale = WORLD_ZOOM * this.settings.size * overlay.scale / (overlay.fixed == 0 ? 2 : 1);
				const onload = function() {
					html_css(element_overlay, "backgroundImage", "url(" + image.src + ")");
					html_css(element_overlay, "backgroundSize", overlay.scale ? px([scale]) : "cover");
				};
				const image = load_image(overlay.image, onload.bind(this));

				// Animate the overlay background image, x direction
				if(overlay.scroll_x > 0) {
					element_overlay.animate([
						{
							backgroundPositionX: px([0])
						}, {
							backgroundPositionX: px([WORLD_RESOLUTION_X])
						}
					], {
						duration: overlay.scroll_x * 1000 * (overlay.fixed == 0 ? 2 : 1),
						direction: "normal",
						easing: "linear",
						iterations: Infinity
					});
				}

				// Animate the overlay background image, y direction
				if(overlay.scroll_y > 0) {
					element_overlay.animate([
						{
							backgroundPositionY: px([0])
						}, {
							backgroundPositionY: px([WORLD_RESOLUTION_Y])
						}
					], {
						duration: overlay.scroll_y * 1000 * (overlay.fixed == 0 ? 2 : 1),
						direction: "normal",
						easing: "linear",
						iterations: Infinity
					});
				}
			}
		}
	}

	// Sets the data of a tile for this layer
	tile_set(x, y, layer, tiles) {
		for(let tile of tiles) {
			// Skip if this tile has a noise function that doesn't pass the check
			if(tile.noise && !tile.noise(x, y, layer))
				continue;

			// If this layer hasn't been set by a previous call, set it up now
			if(!this.layers_element[layer]) {
				this.layers_element[layer] = {};
				this.layers_element[layer].tiles = [];

				this.layers_element[layer].element = html_create("div");
				html_set(this.layers_element[layer].element, "class", "tileset");
				html_css(this.layers_element[layer].element, "zIndex", layer);
				html_parent(this.layers_element[layer].element, this.element, true);

				this.layers_element[layer].element_canvas = html_create("canvas");
				html_set(this.layers_element[layer].element_canvas, "width", this.scale.x * this.settings.size);
				html_set(this.layers_element[layer].element_canvas, "height", this.scale.y * this.settings.size);
				html_parent(this.layers_element[layer].element_canvas, this.layers_element[layer].element, true);
			}

			// Draw this tile on the canvas element at the indicated position, the last call is drawn on top
			const ctx = this.layers_element[layer].element_canvas.getContext("2d");
			ctx.drawImage(this.image, tile.x * this.settings.size, tile.y * this.settings.size, this.settings.size, this.settings.size, x * this.settings.size, y * this.settings.size, this.settings.size, this.settings.size);
	
			// Add the flags of this tile to the layer if any are provided
			// Data: 0 = left, 1 = top, 2 = right, 3 = bottom, 4 = flags
			if(tile.flags) {
				const data = [x * this.settings.size, y * this.settings.size, x * this.settings.size + this.settings.size, y * this.settings.size + this.settings.size, tile.flags];
				if(!this.layers[layer])
					this.layers[layer] = [];
				this.layers[layer].push(data);
			}
		}
	}
}
