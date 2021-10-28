class Map {
	constructor(data) {
		// Create the map element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "map");

		// Create terrain tilesets
		this.tilesets_terrain = [];
		for(let terrain in data.tilesets.terrains)
			this.tilesets_terrain[terrain] = new TilesetTerrain(data.tilesets.terrains[terrain], this.element);
	}

	// Activate this map
	activate() {
		main.appendChild(this.element);
	}

	// Deactivate this map
	deactivate() {
		main.removeChild(this.element);
	}
}

var maps = {};

function register_map(name, data) {
	maps[name] = new Map(data);

	// Automatically activate until we have a map management system
	maps[name].activate();
}
