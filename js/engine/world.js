// TODO: Make the seed customizable and predictable
const WORLD_SEED = Math.random() * 1000000;
const WORLD_RATE = 1000 / 60; // 60 FPS
const WORLD_RESOLUTION_X = 1024;
const WORLD_RESOLUTION_Y = 512;
const WORLD_ZOOM = 2;

class World {
	constructor() {
		// The base element everything in the world will be attached to
		// This is attached to the document body by the loader once everything is ready
		this.element = html_create("div");
		html_set(this.element, "class", "world");
		html_css(this.element, "width", WORLD_RESOLUTION_X);
		html_css(this.element, "height", WORLD_RESOLUTION_Y);

		// The tint element used for transition effects
		this.element_tint = html_create("div");
		html_set(this.element_tint, "class", "world_tint");
		html_parent(this.element_tint, this.element, true);

		// Data storage objects
		this.data_maps = {};
		this.data_actors = {};

		// Child class storage objects
		this.maps = [];
		this.actors = [];
	}

	// Ran once the world is ready to show
	load() {
		html_parent(this.element, document.body, true);
	}

	// Registers data of a new map
	register_data_map(name, settings) {
		this.data_maps[name] = settings;
	}

	// Registers data of a new actor
	register_data_actor(name, settings) {
		this.data_actors[name] = settings;
	}

	// Spawns maps as part of a map grid
	spawn_map_group(data) {
		// Go through all entries in the grid and spawn a new map for each
		// The first map matching the temperature range for its location is spawned
		for(let x = 0; x < data.maps_x; x++) {
			for(let y = 0; y < data.maps_y; y++) {
				const temp = Math.sin((x + WORLD_SEED) * (y + WORLD_SEED));
				for(let map of Object.values(this.data_maps)) {
					if(temp >= map.temp_min && temp <= map.temp_max) {
						const scale = vector([data.scale_x, data.scale_y]);
						const grid = vector([x, y, data.height]);
						const object = new Map(this, map, scale, grid);
						this.maps.push(object);
						break;
					}
				}
			}
		}
	}

	// Register a new player
	spawn_actor_player(name) {
		// As there's no multiplayer support at this time only one player entity is needed
		const settings = this.data_actors[name];
		const object = new ActorPlayer(this, settings);
		this.actors.push(object);

		// Pick a random map to spawn the player in
		const map = get_random(this.maps);
		object.camera = true;
		object.map_set(map, 0, 0);
	}

	// Returns the map located at the given grid position
	map_at_grid(grid) {
		for(let map of this.maps) {
			const map_grid = map.grid;
			if(grid.x == map_grid.x && grid.y == map_grid.y && grid.z == map_grid.z)
				return map;
		}
		return null;
	}

	// Applies a fade effect to the tint
	set_tint(show, time) {
		// CSS animation: Animation name, animation time, animation iterations
		html_css(this.element_tint, "animation", "world_tint_" + (show ? "off " : "on ") + time + "s 1");
	}
}

// Global world object, only one world may exist at a time
const world = new World();
