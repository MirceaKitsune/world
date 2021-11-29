class Map {
	constructor(world, settings, scale, grid) {
		// Maps are spawned by the World class and have an instance as their parent
		// The map stores layer data for tilemaps and actors, allowing the data to be communicated between individual objects
		// Those arrays are used by child objects below, changes made by their instances are reflected here
		// Maps are additionally given a scale and grid vector representing their position in the world
		this.world = world;
		this.settings = settings;
		this.scale = scale;
		this.grid = grid;

		// Create the map element
		this.element = html_create("div");
		html_set(this.element, "class", "map");

		// Add overlays to the map element
		for(let overlay of this.settings.overlays) {
			// Create the overlay element and apply its settings
			const element_overlay = html_create("div");
			html_set(element_overlay, "class", "map_overlay");
			html_css(element_overlay, "backgroundColor", overlay.color);
			html_css(element_overlay, "backgroundImage", "url(" + PATH_IMAGES + overlay.image + ")");
			html_css(element_overlay, "backgroundSize", overlay.scale ? WORLD_ZOOM * overlay.scale + "px" : "cover");
			html_css(element_overlay, "zIndex", overlay.top ? 1 : 0);
			html_parent(element_overlay, this.element, true);

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
		this.element_view = html_create("div");
		html_set(this.element_view, "class", "map_view");
		html_css(this.element_view, "left", (WORLD_RESOLUTION_X / 2) - (this.scale.x / 2));
		html_css(this.element_view, "top", (WORLD_RESOLUTION_Y / 2) - (this.scale.y / 2));
		html_css(this.element_view, "width", px([this.scale.x]));
		html_css(this.element_view, "height", px([this.scale.y]));
		html_parent(this.element_view, this.element, true);

		// Create the tileset for this map, starts inactive by default
		this.tileset = new TilesetTerrain(this, settings.tileset);
		this.active = false;
	}

	// Activate this map
	activate() {
		html_parent(this.element, this.world.element, true);
		this.active = true;
	}

	// Deactivate this map
	deactivate() {
		html_parent(this.element, this.world.element, false);
		this.active = false;
	}
}
