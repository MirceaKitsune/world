class World {
	constructor() {
		// The base element everything in the world will be attached to
		this.element = document.createElement("div");
		this.element.setAttribute("class", "world");
		this.element.style.width = WORLD_RESOLUTION_X;
		this.element.style.height = WORLD_RESOLUTION_Y;
		document.body.appendChild(this.element);

		// World data storage objects
		this.maps = {};
		this.actors = {};
		this.player = null;
	}

	// Register a new map
	register_map(name, settings) {
		this.maps[name] = new Map(this, settings);

		// TODO: Only activate maps here until we have a real map management system
		this.maps[name].activate();
		this.player.map_set(this.maps[name]);
	}

	// Register a new actor
	register_actor(name, settings) {
		this.actors[name] = new Actor(this, settings);
	}

	// Register a new player
	register_player(settings) {
		// As there's no multiplayer support at this time only one player entity is needed
		this.player = new ActorPlayer(this, settings);
	}
}

// Global world object, only one world may exist at a time
const world = new World();
