class ActorPlayer extends Actor {
	init() {
		// Handle key presses for movement
		// The event must be the first parameter of the functions
		document.addEventListener("keydown", this.key_down.bind(this), false);
		document.addEventListener("keyup", this.key_up.bind(this), false);
	}

	// Fires when a key is pressed
	key_down(event) {
		if(event.repeat)
			return;

		if(this.data.acc[0] >= 0 && (event.key == "ArrowLeft" || event.key == "a" || event.key == "A"))
			this.velocity_set_acceleration(-this.settings.acceleration, undefined);
		if(this.data.acc[0] <= 0 && (event.key == "ArrowRight" || event.key == "d" || event.key == "D"))
			this.velocity_set_acceleration(this.settings.acceleration, undefined);
		if(this.data.acc[1] >= 0 && (event.key == "ArrowUp" || event.key == "w" || event.key == "W"))
			this.velocity_set_acceleration(undefined, -this.settings.acceleration);
		if(this.data.acc[1] <= 0 && (event.key == "ArrowDown" || event.key == "s" || event.key == "S"))
			this.velocity_set_acceleration(undefined, this.settings.acceleration);
	}

	// Fires when a key is unpressed
	key_up(event) {
		if(event.repeat)
			return;

		if(this.data.acc[0] < 0 && (event.key == "ArrowLeft" || event.key == "a" || event.key == "A"))
			this.velocity_set_acceleration(0, undefined);
		if(this.data.acc[0] > 0 && (event.key == "ArrowRight" || event.key == "d" || event.key == "D"))
			this.velocity_set_acceleration(0, undefined);
		if(this.data.acc[1] < 0 && (event.key == "ArrowUp" || event.key == "w" || event.key == "W"))
			this.velocity_set_acceleration(undefined, 0);
		if(this.data.acc[1] > 0 && (event.key == "ArrowDown" || event.key == "s" || event.key == "S"))
			this.velocity_set_acceleration(undefined, 0);
	}
}
