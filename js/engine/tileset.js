class Tileset {
	constructor(x, y, settings, data_layers, element) {
		this.settings = settings;
		this.data_layers = data_layers;
		this.element_layers = [];

		// Set the scale of the tilemap so that it covers the range indicated by the parent
		this.scale_x = Math.ceil(x / this.settings.size);
		this.scale_y = Math.ceil(y / this.settings.size);

		// To avoid incorrect draw order sort brushes based on their layer
		this.settings.brushes.sort(function(a, b) { return a.layer - b.layer });

		// The image file used by this tileset, prepares the image and runs the main function once it loads
		this.image = new Image();
		this.image.src = this.settings.image;
		this.image.onload = this.onload.bind(this);

		// Create the tileset element and append it to the parent element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "tileset");
		this.element.style.width = px([this.scale_x * this.settings.size * WORLD_ZOOM]);
		this.element.style.height = px([this.scale_y * this.settings.size * WORLD_ZOOM]);
		element.appendChild(this.element);
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
	tile_set(layer, x, y, data) {
		// The rectangle representing the left / top / right / bottom corners are added in addition to the data we received
		data.rectangle = [
			x * this.settings.size,
			y * this.settings.size,
			x * this.settings.size + this.settings.size,
			y * this.settings.size + this.settings.size
		];

		// Add the data of this tile to the layer data array
		if(!this.data_layers[layer])
			this.data_layers[layer] = [];
		this.data_layers[layer].push(data);
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
			this.element_layers[layer].element_canvas.width = this.scale_x * this.settings.size * WORLD_ZOOM;
			this.element_layers[layer].element_canvas.height = this.scale_y * this.settings.size * WORLD_ZOOM;
			this.element_layers[layer].element.appendChild(this.element_layers[layer].element_canvas);

			const ctx = this.element_layers[layer].element_canvas.getContext("2d");
			ctx.imageSmoothingEnabled = false;
		}

		// Draw this tile on the canvas element at the indicated position, the last call is drawn on top
		const pos = vector(tile);
		const ctx = this.element_layers[layer].element_canvas.getContext("2d");
		ctx.drawImage(this.image, pos.x * this.settings.size, pos.y * this.settings.size, this.settings.size, this.settings.size, x * this.settings.size * WORLD_ZOOM, y * this.settings.size * WORLD_ZOOM, this.settings.size * WORLD_ZOOM, this.settings.size * WORLD_ZOOM);
	}
}
