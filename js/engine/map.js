class Map {
	constructor(data) {
		// Create the map element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "map");

		// The map stores layer data for tilemaps and actors, allowing the data to be communicated between individual objects
		// Those arrays are referenced to object instances below, changes made by those objects are then reflected here
		this.data_layers = [];
		this.data_actors = [];

		// Create terrain tilesets
		this.tilesets_terrain = [];
		for(let terrain in data.tilesets.terrains)
			this.tilesets_terrain[terrain] = new TilesetTerrain(data.scale_x, data.scale_y, data.tilesets.terrains[terrain], this.data_layers, this.element);

		// Create actor entities
		this.actors_players = [];
		for(let player in data.actors.players)
			this.actors_players = new ActorPlayer(data.scale_x, data.scale_y, data.actors.players[player], this.data_layers, this.data_actors, this.element);
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
