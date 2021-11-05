ACTOR_VELOCITY_SLEEP = 0.01;

class Actor {
	constructor(x, y, settings, data_layers, data_actors, element) {
		this.settings = settings;
		this.data_layers = data_layers;
		this.data_actors = data_actors;

		// Reference and prepare public data referring to this actor
		// All settings can be read from or written to using this reference
		this.data_actors_self = data_actors[settings.name] = {};
		this.data_actors_self.box = this.settings.box;
		this.data_actors_self.pos = [0, 0];
		this.data_actors_self.vel = [0, 0];
		this.data_actors_self.acc = [0, 0];
		this.data_actors_self.layer = 0;
		this.data_actors_self.anim = null;

		// Internal functions
		this.interval_velocity = null;
		this.spawned = false;

		// Set the boundaries within which this actor may travel
		this.limit_x = x;
		this.limit_y = y;

		// The image file used by this actor, prepares the image and runs the main function once it loads
		this.image = new Image();
		this.image.src = this.settings.sprite.image;
		this.image.onload = this.onload.bind(this);

		// Create the actor element and append it to the parent element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "sprite");
		this.element.setAttribute("id", "sprite");
		element.appendChild(this.element);

		// Set default position and angle, the actor should be moved to a valid position by the spawn function
		this.position_set(0, 0);
		this.layer_set(0);
		this.set_animation(0, Infinity, this.settings.idle);
	}

	// Executed when the actor was spawned, must be replaced by child classes
	init() {}

	// Executed when the sprite image finishes loading, calls the init function
	onload() {
		// Set the sprite of this actor on the element
		this.element.style.backgroundImage = "url(" + this.image.src + ")";
		this.element.style.backgroundSize = px([this.settings.sprite.scale_x * this.settings.sprite.frames_x, this.settings.sprite.scale_y * this.settings.sprite.frames_y]);
		this.element.style.width = px([this.settings.sprite.scale_x]);
		this.element.style.height = px([this.settings.sprite.scale_y]);

		this.init();
	}

	// Check if a flag exists in the list and return its value if yes
	flag(category, list) {
		for(let flags in this.settings.flags[category])
			if(list.includes(flags))
				return this.settings.flags[category][flags];
		return null;
	}

	// Move the actor to a valid position if they haven't been already spawned
	spawn() {
		if(this.spawned)
			return;
		this.spawned = true;

		// We want to get the topmost floor of each possible position, last valid tile overrides this layer
		// Potential positions are stored as a keys with the last layer of the position as the value
		var positions = {};
		for(let layers in this.data_layers) {
			for(let tiles in this.data_layers[layers]) {
				// We want the position to be the center of the tile
				const tile = this.data_layers[layers][tiles];
				const center_x = tile[0] + (tile[2] - tile[0]) / 2;
				const center_y = tile[1] + (tile[3] - tile[1]) / 2;
				const center = [center_x, center_y];

				// Add or update this position if it's a valid floor, remove it otherwise
				if(this.flag("spawn", tile[4]) > 0)
					positions[center.toString()] = layers;
				else
					delete positions[center.toString()];
			}
		}

		// Extract a random position from the property and its topmost layer from the value
		const keys = Object.keys(positions);
		const index = keys[Math.floor(Math.random() * keys.length)];
		const pos = index.split(",");
		const layer = positions[index];

		// Apply the position and layer
		this.position_set(Number(pos[0]), Number(pos[1]));
		this.layer_set(layer);
		this.set_animation(random_range[0, 4], Infinity, this.settings.idle);
	}

	// Sets the frame and animation of the sprite
	set_animation(frame, duration, speed) {
		const scale_x = this.settings.sprite.scale_x * this.settings.sprite.frames_x;
		const pos_y = this.settings.sprite.scale_y * -frame;

		// Cancel the existing animation
		if(this.data_actors_self.anim) {
			this.data_actors_self.anim.cancel();
			this.data_actors_self.anim = null;
		}

		// Play the animation for this row or show the first frame if static
		if(duration > 0 && speed > 0) {
			this.data_actors_self.anim = this.element.animate([
				{
					backgroundPosition: px([0, pos_y])
				}, {
					backgroundPosition: px([scale_x, pos_y])
				}
			], {
				duration: speed * 1000,
				direction: "normal",
				easing: "steps(" + this.settings.sprite.frames_x + ")",
				iterations: duration
			});
			this.data_actors_self.anim.play();
		} else {
			this.element.style.backgroundPosition = px([0, pos_y]);
		}
	}

	// Sets a velocity which is applied once, used for pushing objects
	velocity_set_impulse(x, y) {
		this.data_actors_self.vel = [this.data_actors_self.vel[0] + x, this.data_actors_self.vel[1] + y];

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.velocity_update.bind(this), WORLD_RATE);
	}

	// Sets a velocity which is applied each frame, used for walking
	velocity_set_acceleration(x, y) {
		const last_x = this.data_actors_self.acc[0];
		const last_y = this.data_actors_self.acc[1];
		if(!isNaN(x))
			this.data_actors_self.acc[0] = x;
		if(!isNaN(y))
			this.data_actors_self.acc[1] = y;

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.velocity_update.bind(this), WORLD_RATE);

		// Set the actor's sprite animation based on movement direction
		// Animates if walking, static if we stopped unless idle pacing is enabled
		if(this.data_actors_self.acc[0] > 0)
			this.set_animation(1, Infinity, this.data_actors_self.acc[0]);
		else if(this.data_actors_self.acc[0] < 0)
			this.set_animation(3, Infinity, -this.data_actors_self.acc[0]);
		else if(this.data_actors_self.acc[1] > 0)
			this.set_animation(2, Infinity, this.data_actors_self.acc[1]);
		else if(this.data_actors_self.acc[1] < 0)
			this.set_animation(0, Infinity, -this.data_actors_self.acc[1]);
		else if(last_x > 0)
			this.set_animation(1, Infinity, this.settings.idle);
		else if(last_x < 0)
			this.set_animation(3, Infinity, this.settings.idle);
		else if(last_y > 0)
			this.set_animation(2, Infinity, this.settings.idle);
		else if(last_y < 0)
			this.set_animation(0, Infinity, this.settings.idle);
	}

	// Returns data regarding the surface this actor will touch at the given distance
	velocity_surface(x, y) {
		// The position we're interested in checking is the actor's current position plus the desired offsets
		// We want to predict movements per direction, store bounding boxes with the X and Y offsets separately
		// Position: 0 = x, 1 = y
		// Box: 0 = left, 1 = top, 2 = right, 3 = bottom
		// Tile: 0 = left, 1 = top, 2 = right, 3 = bottom, 4 = flags
		const height = this.data_actors_self.layer;
		const pos = this.data_actors_self.pos;
		const box = this.data_actors_self.box;
		const ofs_x = [pos[0] + box[0] + x, pos[1] + box[1] + 0, pos[0] + box[2] + x, pos[1] + box[3] + 0];
		const ofs_y = [pos[0] + box[0] + 0, pos[1] + box[1] + y, pos[0] + box[2] + 0, pos[1] + box[3] + y];

		var solid_x = true;
		var solid_y = true;
		var layer = 0;
		var layer_path = false;
		var flags = [];

		// Go through the tiles on each layer and pick relevant data from tiles who's boundaries the actor is within
		// This relies on layers being scanned in bottom to top order, topmost entries must be allowed to override lower ones
		for(let layers in this.data_layers) {
			for(let tiles in this.data_layers[layers]) {
				const tile = this.data_layers[layers][tiles];
				const touching_x = intersects(ofs_x, tile);
				const touching_y = intersects(ofs_y, tile);
				if(!touching_x && !touching_y)
					continue;

				// Remember the last layer we touched and inherit its flags
				// If the actor is standing on a path tile, this layer will be applied while all floors become valid
				flags = tile[4];
				layer = layers;
				if(this.flag("path", flags) > 0)
					layer_path = true;

				// We're touching a solid if this is either a non-solid tile or one from a non-valid layer
				// The topmost surface is counted so a later iteration may override this decision
				if(this.flag("solid", flags) > 0) {
					if(touching_x)
						solid_x = true;
					if(touching_y)
						solid_y = true;
				} else {
					if(touching_x)
						solid_x = layers != height && !layer_path;
					if(touching_y)
						solid_y = layers != height && !layer_path;
				}
			}
		}

		// Return an object containing relevant data for this surface
		return {
			solid_x: solid_x,
			solid_y: solid_y,
			layer: layer_path && layer,
			flags: flags
		};
	}

	// Runs each frame when a velocity is set to preform updates, turns itself off once movement stops
	velocity_update() {
		var flags = [];

		// Apply constant velocity
		this.data_actors_self.vel[0] += this.data_actors_self.acc[0];
		this.data_actors_self.vel[1] += this.data_actors_self.acc[1];

		// Amount by which to convert the velocity to a change in position, halved by default
		// This must never be larger than the velocity, if it passes zero and flips signs the actor would reverse direction instead of stopping
		var transfer_x = this.data_actors_self.vel[0] / 2;
		var transfer_y = this.data_actors_self.vel[1] / 2;

		// Get data about the topmost item we'd collide with based on the direction we're moving in
		const surface = this.velocity_surface(transfer_x, transfer_y);
		if(surface) {
			// Stop in the direction we're colliding toward
			if(surface.solid_x) {
				this.data_actors_self.vel[0] = 0;
				transfer_x = 0;
			}
			if(surface.solid_y) {
				this.data_actors_self.vel[1] = 0;
				transfer_y = 0;
			}

			// If we stepped on a tile that wants to take us to a new layer, apply the new height to the actor
			if(surface.layer)
				this.layer_set(surface.layer);

			// Set the flags from this surface
			flags = surface.flags;
		}

		// Apply the transition to the new position of the actor
		var pos = this.position_get();
		pos.x += transfer_x;
		pos.y += transfer_y;
		this.position_set(pos.x, pos.y);

		// Determine the friction this actor is experiencing based on the surface they're moving on
		// We lose the transition amount from the velocity based on friction
		const friction = this.flag("friction", flags);
		this.data_actors_self.vel[0] -= transfer_x * friction;
		this.data_actors_self.vel[1] -= transfer_y * friction;

		// Stop movement updates once we reach the threshold for physics sleeping
		if(Math.abs(this.data_actors_self.vel[0]) <= ACTOR_VELOCITY_SLEEP && Math.abs(this.data_actors_self.vel[1]) <= ACTOR_VELOCITY_SLEEP) {
			this.data_actors_self.vel[0] = 0;
			this.data_actors_self.vel[1] = 0;
			clearInterval(this.interval_velocity);
			this.interval_velocity = null;
		}
	}

	// Returns the position of this actor
	position_get() {
		return vector(this.data_actors_self.pos);
	}

	// Teleports the actor to this position
	position_set(x, y) {
		this.data_actors_self.pos = [x, y];

		// Offset the sprite so that the pivot point is centered horizontally and at the bottom vertically
		this.element.style.left = this.data_actors_self.pos[0] - this.settings.sprite.scale_x / 2;
		this.element.style.top = this.data_actors_self.pos[1] - this.settings.sprite.scale_y;
	}

	// Sets the solidity level of this actor
	layer_set(layer) {
		this.data_actors_self.layer = layer;
		this.element.style.zIndex = this.data_actors_self.layer;
	}
}
