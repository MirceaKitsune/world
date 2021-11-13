class Map {
	constructor(world, settings) {
		// Maps are spawned by the World class and have an instance as their parent
		// The map stores layer data for tilemaps and actors, allowing the data to be communicated between individual objects
		// Those arrays are used by child objects below, changes made by their instances are reflected here
		this.world = world;
		this.settings = settings;
		this.layers = [];

		// Store the scale and noise settings of our map
		this.scale_x = settings.scale_x;
		this.scale_y = settings.scale_y;
		this.noise_x = settings.noise_x;
		this.noise_y = settings.noise_y;

		// Create the map element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "map");

		// Add overlays to the map element
		for(let overlays in this.settings.overlays) {
			const overlay = this.settings.overlays[overlays];

			// Create the overlay element and apply its settings
			const element_overlay = document.createElement("div");
			element_overlay.setAttribute("class", "map_overlay");
			element_overlay.style.backgroundColor = overlay.color;
			element_overlay.style.backgroundImage = "url(" +  overlay.image + ")";
			element_overlay.style.backgroundSize = overlay.scale ? WORLD_ZOOM * overlay.scale + "px" : "cover";
			element_overlay.style.zIndex = overlay.top ? 1 : 0;
			this.element.appendChild(element_overlay);

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
		this.element_view.style.left = (WORLD_RESOLUTION_X / 2) - (settings.scale_x / 2);
		this.element_view.style.top = (WORLD_RESOLUTION_Y / 2) - (settings.scale_y / 2);
		this.element_view.style.width = px([settings.scale_x]);
		this.element_view.style.height = px([settings.scale_y]);
		this.element.appendChild(this.element_view);

		// Create terrain tilesets
		this.tilesets_terrain = [];
		for(let terrain in settings.tilesets.terrains)
			this.tilesets_terrain[terrain] = new TilesetTerrain(this, settings.tilesets.terrains[terrain]);
	}

	// Activate this map
	activate() {
		this.world.element.appendChild(this.element);
	}

	// Deactivate this map
	deactivate() {
		this.world.element.removeChild(this.element);
	}
}
