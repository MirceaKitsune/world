class Map {
	constructor(data) {
		// The map stores layer data for tilemaps and actors, allowing the data to be communicated between individual objects
		// Those arrays are referenced to object instances below, changes made by those objects are then reflected here
		this.data_layers = [];
		this.data_actors = [];
		this.overlays = data.overlays;
		this.scale_x = data.scale_x;
		this.scale_y = data.scale_y;
		this.perspective = data.perspective;

		// Create the map element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "map");

		// Add overlays to the map element
		for(let overlays in this.overlays) {
			const overlay = this.overlays[overlays];

			// Create overlay element
			const element_overlay = document.createElement("div");
			element_overlay.setAttribute("class", "map_overlay");
			this.element.appendChild(element_overlay);

			// Customize overlay settings
			element_overlay.style.backgroundColor = overlay.color;
			element_overlay.style.backgroundImage = "url(" +  overlay.image + ")";
			element_overlay.style.backgroundSize = overlay.scale ? WORLD_ZOOM * overlay.scale + "px" : "cover";
			element_overlay.style.zIndex = overlay.top ? 1 : 0;

			// Animate the overlay background, x direction
			if(overlay.scroll_x > 0) {
				element_overlay.animate([
					{
						backgroundPositionX: "0px"
					}, {
						backgroundPositionX: WORLD_RESOLUTION_X + "px"
					}
				], {
					duration: overlay.scroll_x * 1000,
					direction: "normal",
					easing: "linear",
					iterations: Infinity
				});
			}

			// Animate the overlay background, y direction
			if(overlay.scroll_y > 0) {
				element_overlay.animate([
					{
						backgroundPositionY: "0px"
					}, {
						backgroundPositionY: WORLD_RESOLUTION_Y + "px"
					}
				], {
					duration: overlay.scroll_y * 1000,
					direction: "normal",
					easing: "linear",
					iterations: Infinity
				});
			}
		}

		// Create the map view element
		// Center the map view element in the main element, both when it's smaller or when it is larger
		this.element_view = document.createElement("div");
		this.element_view.setAttribute("class", "map_view");
		this.element_view.style.left = (WORLD_RESOLUTION_X / 2) - (data.scale_x / 2);
		this.element_view.style.top = (WORLD_RESOLUTION_Y / 2) - (data.scale_y / 2);
		this.element_view.style.width = px([data.scale_x]);
		this.element_view.style.height = px([data.scale_y]);
		this.element.appendChild(this.element_view);

		// Create terrain tilesets
		this.tilesets_terrain = [];
		for(let terrain in data.tilesets.terrains)
			this.tilesets_terrain[terrain] = new TilesetTerrain(data.scale_x, data.scale_y, data.tilesets.terrains[terrain], this.data_layers, this.element_view);

		// Create actor entities
		this.actors_players = [];
		for(let player in data.actors.players)
			this.actors_players = new ActorPlayer(data.scale_x, data.scale_y, data.actors.players[player], this.data_layers, this.data_actors, this.element_view);
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
