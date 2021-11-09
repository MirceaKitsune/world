class Map {
	constructor(data) {
		// Create the map element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "map");

		// Center the map element in the main element, both when it's smaller or when it is larger
		this.element.style.left = (WORLD_RESOLUTION_X / 2) - (data.scale_x / 2);
		this.element.style.top = (WORLD_RESOLUTION_Y / 2) - (data.scale_y / 2);
		this.element.style.width = px([data.scale_x]);
		this.element.style.height = px([data.scale_y]);

		// The map stores layer data for tilemaps and actors, allowing the data to be communicated between individual objects
		// Those arrays are referenced to object instances below, changes made by those objects are then reflected here
		this.data_layers = [];
		this.data_actors = [];
		this.scale = [data.scale_x, data.scale_y];

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
