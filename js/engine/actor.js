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

		// Set the boundaries within which this actor may travel
		this.limit_x = x;
		this.limit_y = y;

		// Interval functions used to control timers
		this.interval_velocity = null;

		// The image file used by this actor, prepares the image and runs the main function once it loads
		this.image = new Image();
		this.image.src = this.settings.sprite.image;
		this.image.onload = this.onload.bind(this);

		// Create the actor element and append it to the parent element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "sprite");
		this.element.setAttribute("id", "sprite");
		element.appendChild(this.element);

		// Set default position and angle
		this.position_set(0, 0);
		this.layer_set(1);
		this.set_animation(2, Infinity, this.settings.idle);
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

	// Checks if the actor would collide with anything at the given distance, returns a description of the touched surfaces
	velocity_collisions(x, y) {
		const height = this.data_actors_self.layer;
		const vel = vector([x, y]);

		// The position we're interested in checking is the actor's current position plus the desired offsets
		// We want to predict some movements only in one direction, also store bounding boxes for the new position with just the X or Y offset
		// Position: 0 = x, 1 = y
		// Box: 0 = left, 1 = top, 2 = right, 3 = bottom
		const pos = this.data_actors_self.pos;
		const box = this.data_actors_self.box;
		const ofs = [pos[0] + box[0] + x, pos[1] + box[1] + y, pos[0] + box[2] + x, pos[1] + box[3] + y];
		const ofs_x = [pos[0] + box[0] + x, pos[1] + box[1] + 0, pos[0] + box[2] + x, pos[1] + box[3] + 0];
		const ofs_y = [pos[0] + box[0] + 0, pos[1] + box[1] + y, pos[0] + box[2] + 0, pos[1] + box[3] + y];

		// Default decisions overridden below
		var solid_x = true;
		var solid_y = true;
		var layer = null;
		var layer_min = height;
		var layer_max = height;

		// Go through the tiles on each layer and selectively pick relevant data from tiles who's boundaries the actor is within
		// This relies on layers being scanned in bottom to top order, topmost entries must override lower ones
		for(let layers in this.data_layers) {
			for(let tiles in this.data_layers[layers]) {
				// Determine in which directions bounding boxes are intersecting
				const tile = this.data_layers[layers][tiles];
				const touching = ofs[2] >= tile.rectangle[0] && ofs[3] >= tile.rectangle[1] && ofs[0] <= tile.rectangle[2] && ofs[1] <= tile.rectangle[3];
				const touching_x = ofs_x[2] >= tile.rectangle[0] && ofs_x[3] >= tile.rectangle[1] && ofs_x[0] <= tile.rectangle[2] && ofs_x[1] <= tile.rectangle[3];
				const touching_y = ofs_y[2] >= tile.rectangle[0] && ofs_y[3] >= tile.rectangle[1] && ofs_y[0] <= tile.rectangle[2] && ofs_y[1] <= tile.rectangle[3];

				// If the actor is standing on a path, all non-solid tiles between its start and end layers become valid targets to move to
				// Also position the actor on the highest layer being touched so they move at the bottom or top accordingly
				if(touching) {
					if(tile.path && (height == layers || height == tile.path)) {
						layer_min = layers;
						layer_max = tile.path;
					}
					if(layers == layer_min || layers == layer_max)
						layer = layers;
				}

				// Three methods are used to describe a solid tile:
				// true: Is solid both on this layer and all others, usually walls
				// false: Is not solid on this layer but is solid on others, usually floors
				// undefined: Is not solid and won't affect collisions at all, usually floating decorations
				// The topmost collision is counted so another surface covering this later will override solidity
				if(tile.solid == true) {
					if(touching_x)
						solid_x = true;
					if(touching_y)
						solid_y = true;
				} else if(tile.solid == false) {
					if(touching_x)
						solid_x = layers < layer_min || layers > layer_max;
					if(touching_y)
						solid_y = layers < layer_min || layers > layer_max;
				}
			}
		}

		// Return an object containing relevant data for this collision
		return {
			solid_x: solid_x,
			solid_y: solid_y,
			layer: layer
		};
	}

	// Runs each frame when a velocity is set to preform updates, turns itself off once movement stops
	velocity_update() {
		// Apply constant velocity
		this.data_actors_self.vel[0] += this.data_actors_self.acc[0];
		this.data_actors_self.vel[1] += this.data_actors_self.acc[1];

		// Amount by which to convert the velocity to a change in position, half it by default
		// This must never be larger than the velocity, if it passes zero and flips signs the actor would reverse direction instead of stopping
		var transfer_x = this.data_actors_self.vel[0] / 2;
		var transfer_y = this.data_actors_self.vel[1] / 2;

		// Get data about the topmost item we'd collide with based on the direction we're moving in
		const collision = this.velocity_collisions(transfer_x, transfer_y);
		if(collision) {
			// Stop in the direction we're colliding toward
			if(collision.solid_x == true) {
				this.data_actors_self.vel[0] = 0;
				transfer_x = 0;
			}
			if(collision.solid_y == true) {
				this.data_actors_self.vel[1] = 0;
				transfer_y = 0;
			}

			// If we stepped on a path tile, apply the new layer it took the actor to
			if(collision.layer)
				this.layer_set(collision.layer);
		}

		// Apply the transition to the new position of the actor
		var pos = this.position_get();
		pos.x += transfer_x;
		pos.y += transfer_y;
		this.position_set(pos.x, pos.y);

		// Lose the transition from velocity based on friction
		this.data_actors_self.vel[0] -= transfer_x * this.settings.friction;
		this.data_actors_self.vel[1] -= transfer_y * this.settings.friction;

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
