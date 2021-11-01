ACTOR_VELOCITY_SLEEP = 0.01;

class Actor {
	constructor(data, element) {
		this.data = data;
		this.pos = [0, 0];
		this.vel = [0, 0];
		this.acc = [0, 0];
		this.layer = 0;
		this.anim = null;
		this.interval_velocity = null;

		// Create the actor element and append it to the parent element
		this.element = document.createElement("div");
		this.element.setAttribute("class", "sprite");
		this.element.setAttribute("id", "sprite");
		element.appendChild(this.element);

		// Set the sprite of this actor on the element
		this.element.style.backgroundImage = "url(" + this.data.sprite.sprite + ")";
		this.element.style.backgroundSize = px([this.data.sprite.scale_x * this.data.sprite.frames_x, this.data.sprite.scale_y * this.data.sprite.frames_y]);
		this.element.style.width = px([this.data.sprite.scale_x]);
		this.element.style.height = px([this.data.sprite.scale_y]);

		// Set default position and angle
		this.set_position(0, 0);
		this.set_layer(1);
		this.set_animation(2, Infinity, this.data.idle);

		// Execute the init function
		this.init();
	}

	// Executed when the actor was spawned, must be replaced by child classes
	init() {}

	// Sets the frame and animation of the sprite
	set_animation(frame, duration, speed) {
		const scale_x = this.data.sprite.scale_x * this.data.sprite.frames_x;
		const pos_y = this.data.sprite.scale_y * -frame;

		// Cancel the existing animation
		if(this.anim) {
			this.anim.cancel();
			this.anim = null;
		}

		// Play the animation for this row or show the first frame if static
		if(duration > 0 && speed > 0) {
			this.anim = this.element.animate([
				{
					backgroundPosition: px([0, pos_y])
				}, {
					backgroundPosition: px([scale_x, pos_y])
				}
			], {
				duration: speed * 1000,
				direction: "normal",
				easing: "steps(" + this.data.sprite.frames_x + ")",
				iterations: duration
			});
			this.anim.play();
		} else {
			this.element.style.backgroundPosition = px([0, pos_y]);
		}
	}

	// Sets a velocity which is applied once, used for pushing objects
	velocity_impulse(x, y) {
		this.vel = [this.vel[0] + x, this.vel[1] + y];

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.update_velocity.bind(this), WORLD_RATE);
	}

	// Sets a velocity which is applied each frame, used for walking
	acceleration(x, y) {
		const last_x = this.acc[0];
		const last_y = this.acc[1];
		if(!isNaN(x))
			this.acc[0] = x;
		if(!isNaN(y))
			this.acc[1] = y;

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.update_velocity.bind(this), WORLD_RATE);

		// Set the actor's sprite animation based on movement direction
		// Animates if walking, static if we stopped unless idle pacing is enabled
		if(this.acc[0] > 0)
			this.set_animation(1, Infinity, this.acc[0]);
		else if(this.acc[0] < 0)
			this.set_animation(3, Infinity, -this.acc[0]);
		else if(this.acc[1] > 0)
			this.set_animation(2, Infinity, this.acc[1]);
		else if(this.acc[1] < 0)
			this.set_animation(0, Infinity, -this.acc[1]);
		else if(last_x > 0)
			this.set_animation(1, Infinity, this.data.idle);
		else if(last_x < 0)
			this.set_animation(3, Infinity, this.data.idle);
		else if(last_y > 0)
			this.set_animation(2, Infinity, this.data.idle);
		else if(last_y < 0)
			this.set_animation(0, Infinity, this.data.idle);
	}

	// Runs each frame when a velocity is set to preform updates, turns itself off once movement stops
	update_velocity() {
		// Apply constant velocity
		this.vel[0] += this.acc[0];
		this.vel[1] += this.acc[1];

		// Amount by which to convert the velocity to a change in position, half it by default
		// This must never be larger than the velocity, if it passes zero and flips signs the actor would reverse direction instead of stopping
		const transfer_x = this.vel[0] / 2;
		const transfer_y = this.vel[1] / 2;

		// Apply the transition to the new position of the actor
		var pos = this.get_position();
		pos.x += transfer_x;
		pos.y += transfer_y;
		this.set_position(pos.x, pos.y);

		// Lose the transition from velocity based on friction
		this.vel[0] -= transfer_x * this.data.friction;
		this.vel[1] -= transfer_y * this.data.friction;

		// Stop movement updates once we reach the threshold for physics sleeping
		if(Math.abs(this.vel[0]) <= ACTOR_VELOCITY_SLEEP && Math.abs(this.vel[1]) <= ACTOR_VELOCITY_SLEEP) {
			this.vel[0] = 0;
			this.vel[1] = 0;
			clearInterval(this.interval_velocity);
			this.interval_velocity = null;
		}
	}

	// Returns the position of this actor
	get_position() {
		return vector(this.pos);
	}

	// Teleports the actor to this position
	set_position(x, y) {
		this.pos = [x, y];
		this.element.style.left = this.pos[0];
		this.element.style.top = this.pos[1];
	}

	// Sets the solidity level of this actor
	set_layer(layer) {
		this.layer = layer;
		this.element.style.zIndex = this.layer;
	}
}
