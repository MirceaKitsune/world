class Tileset {
	constructor(data, element) {
		this.data = data;
		this.element = null;
		this.layers = [];

		this.image = new Image();
		this.image.src = this.data.tileset;
		this.image.onload = this.onload.bind(this);

		// To avoid incorrect draw order across layers, brushes are sorted based on their height
		this.data.brushes.sort(function(a, b) { return a.height - b.height });

		// Create the tileset element and append it to the parent element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "tileset");
		this.element.style.width = px([this.data.scale_x * this.data.tilesize * WORLD_ZOOM]);
		this.element.style.height = px([this.data.scale_y * this.data.tilesize * WORLD_ZOOM]);
		element.appendChild(this.element);

		// Prepare layer elements and the 2D array used to store tiles
		for(let i = 0; i < this.data.layers; i++) {
			this.layers[i] = {};
			this.layers[i].tiles = [];
			for(let x = 0; x < this.data.scale_x; x++) {
				this.layers[i].tiles[x] = [];
				for(let y = 0; y < this.data.scale_y; y++) {
					this.layers[i].tiles[x][y] = [];
				}
			}

			this.layers[i].element = document.createElement("div");
			this.layers[i].element.setAttribute("class", "tileset");
			this.layers[i].element.style.zIndex = i;
			this.element.appendChild(this.layers[i].element);

			this.layers[i].element_canvas = document.createElement("canvas");
			this.layers[i].element_canvas.width = this.data.scale_x * this.data.tilesize * WORLD_ZOOM;
			this.layers[i].element_canvas.height = this.data.scale_y * this.data.tilesize * WORLD_ZOOM;
			this.layers[i].element.appendChild(this.layers[i].element_canvas);

			const ctx = this.layers[i].element_canvas.getContext("2d");
			ctx.imageSmoothingEnabled = false;
		}
	}

	remove() {
		for(let layer in this.layers)
			this.layers[layer].remove();
		if(main.contains(this.element))
			this.element.remove();

		this.data = {};
		this.element = null;
		this.layers = [];
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

	// Returns a tile from the given layer
	tile_get(layer, x, y) {
		const l = this.layers[layer];
		if(l.tiles && l.tiles[x] && l.tiles[x][y])
			return l.tiles[x][y];
		return null;
	}

	// Sets and draws a tile for this layer, the last call is drawn on top and replaces the settings of the previous tile
	tile_set(layer, x, y, tile) {
		this.layers[layer].tiles[x][y] = tile;
		const pos = vector(tile.tile);
		const ctx = this.layers[layer].element_canvas.getContext("2d");
		ctx.drawImage(this.image, pos.x * this.data.tilesize, pos.y * this.data.tilesize, this.data.tilesize, this.data.tilesize, x * this.data.tilesize * WORLD_ZOOM, y * this.data.tilesize * WORLD_ZOOM, this.data.tilesize * WORLD_ZOOM, this.data.tilesize * WORLD_ZOOM);
	}
}
