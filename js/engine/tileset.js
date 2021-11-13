class Tileset {
	constructor(map, settings) {
		// Tilesets are spawned by the Map class and have an instance as their parent
		// We work with the layers object from the parent Map, changes made to it are reflected universally
		this.map = map;
		this.map_layers = this.map.layers;
		this.settings = settings;
		this.element_layers = [];

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

		// To avoid incorrect draw order sort brushes based on their layer
		this.settings.brushes.sort(function(a, b) { return a.layer - b.layer });

		// The image file used by this tileset, prepares the image and runs the main function once it loads
		this.image = new Image();
		this.image.src = this.settings.image;
		this.image.onload = this.onload.bind(this);

		// Create the tileset element and append it to the parent element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "tileset");
		this.element.style.width = px([this.scale.x * this.settings.size]);
		this.element.style.height = px([this.scale.y * this.settings.size]);
		this.map.element_view.appendChild(this.element);
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

	// Sets the data of a tile for this layer
	tile_set(layer, x, y, tile, flags) {
		// Data: 0 = left, 1 = top, 2 = right, 3 = bottom, 4 = flags
		if(flags) {
			var data = [
				x * this.settings.size,
				y * this.settings.size,
				x * this.settings.size + this.settings.size,
				y * this.settings.size + this.settings.size,
				flags
			];
			if(!this.map_layers[layer])
				this.map_layers[layer] = [];
			this.map_layers[layer].push(data);
		}

		// Tile: 0 = left, 1 = top
		if(tile)
			this.tile_draw(layer, x, y, tile);
	}

	// Draws a tile on the canvas of its layer
	tile_draw(layer, x, y, tile) {
		// If this layer hasn't been set by a previous call, set it up now
		if(!this.element_layers[layer]) {
			this.element_layers[layer] = {};
			this.element_layers[layer].tiles = [];

			this.element_layers[layer].element = document.createElement("div");
			this.element_layers[layer].element.setAttribute("class", "tileset");
			this.element_layers[layer].element.style.zIndex = layer;
			this.element.appendChild(this.element_layers[layer].element);

			this.element_layers[layer].element_canvas = document.createElement("canvas");
			this.element_layers[layer].element_canvas.width = this.scale.x * this.settings.size;
			this.element_layers[layer].element_canvas.height = this.scale.y * this.settings.size;
			this.element_layers[layer].element.appendChild(this.element_layers[layer].element_canvas);

			// If this tileset uses fog, apply the fog color as the background color of this layer's element
			// If the fog setting is an array use the value for this height, if not it's a constant color
			if(this.settings.fog) {
				const fog = typeof this.settings.fog === "object" ? this.settings.fog[layer] : this.settings.fog;
				this.element_layers[layer].element.style.backgroundColor = fog;
			}
		}

		// Draw this tile on the canvas element at the indicated position, the last call is drawn on top
		const pos = vector(tile);
		const ctx = this.element_layers[layer].element_canvas.getContext("2d");
		ctx.drawImage(this.image, pos.x * this.settings.size, pos.y * this.settings.size, this.settings.size, this.settings.size, x * this.settings.size, y * this.settings.size, this.settings.size, this.settings.size);
	}
}
