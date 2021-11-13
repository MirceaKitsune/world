class World {
	constructor() {
		// The base element everything in the world will be attached to
		this.element = document.createElement("div");
		this.element.setAttribute("class", "world");
		this.element.style.width = WORLD_RESOLUTION_X;
		this.element.style.height = WORLD_RESOLUTION_Y;
		document.body.appendChild(this.element);

		// Data storage objects
		this.data_maps = {};
		this.data_actors = {};

		// Child class storage objects
		this.maps = [];
		this.actors = [];
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
				for(let maps in this.data_maps) {
					const map = this.data_maps[maps];
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
		for(let maps in this.maps) {
			const map = this.maps[maps];
			const map_grid = map.grid;
			if(grid.x == map_grid.x && grid.y == map_grid.y && grid.z == map_grid.z)
				return map;
		}
		return null;
	}
}

// Global world object, only one world may exist at a time
const world = new World();
