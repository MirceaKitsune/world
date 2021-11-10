class World {
	constructor(maps, actors, player) {
		// The base element everything in the world will be attached to
		this.element = document.createElement("div");
		this.element.setAttribute("class", "world");
		this.element.style.width = WORLD_RESOLUTION_X;
		this.element.style.height = WORLD_RESOLUTION_Y;
		document.body.appendChild(this.element);

		// Create maps
		this.maps = {};
		for(let map in maps) {
			const settings = maps[map];
			this.maps[settings.name] = new Map(this, settings);

			// TODO: Only activate maps here until we have a real map management system
			this.maps[settings.name].activate();
		}

		// Create actors
		this.actors = {};
		for(let actor in actors) {
			const settings = actors[actor];
			this.actors[settings.name] = new Actor(this, settings);
		}

		// Create players
		// As there's no multiplayer support only one player entity exists by design at the moment
		this.player = new ActorPlayer(this, player);

		// TODO: Only activate maps here until we have a real map management system
		const map = this.maps[Object.keys(this.maps)[0]];
		this.player.map_set(map);
	}
}

// Create the world with the given data
// Only one world may exist at a time, this must never be ran more than once
function world(maps, actors, player) {
	new World(maps, actors, player);
}
