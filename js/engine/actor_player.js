class ActorPlayer extends Actor {
	init() {
		// Handle key presses for movement
		// The event must be the first parameter of the functions
		document.addEventListener("keydown", this.key_down.bind(this), false);
		document.addEventListener("keyup", this.key_up.bind(this), false);

		// Pressed movement keys: -x = left, +x = right, -y = up, +y = down
		this.keys = [0, 0];

		// This is the player, the camera follows them
		this.camera = true;
	}

	// Fires when a key is pressed
	key_down(event) {
		if(event.repeat)
			return;

		const vel = this.settings.velocity_move;
		if(event.key == "ArrowLeft" || event.key == "a") {
			this.keys[0] -= this.settings.acceleration;
			this.velocity_set_acceleration(this.keys[0], undefined);
		} else if(event.key == "ArrowRight" || event.key == "d") {
			this.keys[0] += this.settings.acceleration;
			this.velocity_set_acceleration(this.keys[0], undefined);
		} else if(event.key == "ArrowUp" || event.key == "w") {
			this.keys[1] -= this.settings.acceleration;
			this.velocity_set_acceleration(undefined, this.keys[1]);
		} else if(event.key == "ArrowDown" || event.key == "s") {
			this.keys[1] += this.settings.acceleration;
			this.velocity_set_acceleration(undefined, this.keys[1]);
		}
	}

	// Fires when a key is unpressed
	key_up(event) {
		if(event.repeat)
			return;

		const vel = this.settings.velocity_move;
		if(event.key == "ArrowLeft" || event.key == "a") {
			this.keys[0] += this.settings.acceleration;
			this.velocity_set_acceleration(this.keys[0], undefined);
		} else if(event.key == "ArrowRight" || event.key == "d") {
			this.keys[0] -= this.settings.acceleration;
			this.velocity_set_acceleration(this.keys[0], undefined);
		} else if(event.key == "ArrowUp" || event.key == "w") {
			this.keys[1] += this.settings.acceleration;
			this.velocity_set_acceleration(undefined, this.keys[1]);
		} else if(event.key == "ArrowDown" || event.key == "s") {
			this.keys[1] -= this.settings.acceleration;
			this.velocity_set_acceleration(undefined, this.keys[1]);
		}
	}
}
