ACTOR_VELOCITY_SLEEP = 0.01;

class Actor {
	constructor(x, y, settings, data_layers, data_actors, element) {
		this.settings = settings;
		this.data_layers = data_layers;
		this.data_actors = data_actors;

		// Reference and prepare public data referring to this actor
		// All settings can be read from or written to using this reference
		this.data_actors_self = data_actors[settings.name] = {};
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

	// Runs each frame when a velocity is set to preform updates, turns itself off once movement stops
	velocity_update() {
		// Apply constant velocity
		this.data_actors_self.vel[0] += this.data_actors_self.acc[0];
		this.data_actors_self.vel[1] += this.data_actors_self.acc[1];

		// Amount by which to convert the velocity to a change in position, half it by default
		// This must never be larger than the velocity, if it passes zero and flips signs the actor would reverse direction instead of stopping
		const transfer_x = this.data_actors_self.vel[0] / 2;
		const transfer_y = this.data_actors_self.vel[1] / 2;

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
		this.element.style.left = this.data_actors_self.pos[0];
		this.element.style.top = this.data_actors_self.pos[1];
	}

	// Sets the solidity level of this actor
	layer_set(layer) {
		this.data_actors_self.layer = layer;
		this.element.style.zIndex = this.data_actors_self.layer;
	}
}
