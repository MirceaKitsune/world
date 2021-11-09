ACTOR_VELOCITY_SLEEP = 0.01;
ACTOR_VELOCITY_STEP = 0.25;
ACTOR_CAMERA_SLEEP_POSITION = 0.1;
ACTOR_CAMERA_SLEEP_HEIGHT = 0.001;
ACTOR_CAMERA_SPEED_POSITION = 0.05;
ACTOR_CAMERA_SPEED_HEIGHT = 0.025;

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
		this.data_actors_self.flags = [];
		this.data_actors_self.movement = 0;
		this.data_actors_self.angle = 0;
		this.data_actors_self.layer = 0;
		this.data_actors_self.anim = null;

		// Internal functions
		// TODO: We use an interval to check for spawn because actors may load before tiles, fix this by guaranteeing proper load order
		this.interval_velocity = null;
		this.interval_spawn = setInterval(this.spawn.bind(this), WORLD_RATE);
		this.interval_camera = null;
		this.camera = false;
		this.camera_pos = [x / 2, y / 2, 0];

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
		this.animation(0, this.settings.idle);
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

	// Focuses the camera on the position of the actor
	camera_update() {
		// TODO: Reference the active map once map management is implemented
		// The target height is kept in 0 to 1 range for easy control against the hardcoded 0px perspective: 0 is no zoom, 0.5 is double, etc
		// Its value is never allowed to reach 1 by design as that would produce infinite zoom
		const pos = this.data_actors_self.pos;
		const map = maps[Object.keys(maps)[0]];
		const element = map.element;
		const target_x = (map.scale[0] / 2) - pos[0];
		const target_y = (map.scale[1] / 2) - pos[1];
		const target_height = 1 - 1 / (WORLD_ZOOM + (this.data_actors_self.layer * map.perspective));

		// Make the camera parameters slowly approach those of the target for transition effect
		// Camera position: 0 = x, 1 = y, 2 = height
		this.camera_pos[0] = this.camera_pos[0] + (target_x - this.camera_pos[0]) * ACTOR_CAMERA_SPEED_POSITION;
		this.camera_pos[1] = this.camera_pos[1] + (target_y - this.camera_pos[1]) * ACTOR_CAMERA_SPEED_POSITION;
		this.camera_pos[2] = this.camera_pos[2] + (target_height - this.camera_pos[2]) * ACTOR_CAMERA_SPEED_HEIGHT;

		// If the transition is close enough to the target position we can snap to it and stop running the check
		if(Math.abs(this.camera_pos[0] - target_x) < ACTOR_CAMERA_SLEEP_POSITION)
			this.camera_pos[0] = target_x;
		if(Math.abs(this.camera_pos[1] - target_y) < ACTOR_CAMERA_SLEEP_POSITION)
			this.camera_pos[1] = target_y;
		if(Math.abs(this.camera_pos[2] - target_height) < ACTOR_CAMERA_SLEEP_HEIGHT)
			this.camera_pos[2] = target_height;
		if(this.camera_pos[0] == target_x && this.camera_pos[1] == target_y && this.camera_pos[2] == target_height) {
			clearInterval(this.interval_camera);
			this.interval_camera = null;
		}

		// Apply camera position and zoom by using a translate3d CSS transform on the world element
		element.style.transform = "perspective(0px) translate3d(" + this.camera_pos[0] + "px, " + this.camera_pos[1] + "px, " + this.camera_pos[2] + "px)";
	}

	// Check if a flag exists in the list and return its value if yes
	flag(category, list) {
		for(let flags in this.settings.flags[category])
			if(list.includes(flags))
				return this.settings.flags[category][flags];
		return null;
	}

	// Check that a valid position is available and moves the actor to it
	spawn() {
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

		// Skip if no valid positions were found this attempt
		if(positions.length == 0)
			return;

		// Extract a random position from the property and its topmost layer from the value
		const keys = Object.keys(positions);
		const index = keys[Math.floor(Math.random() * keys.length)];
		const pos = index.split(",");
		const layer = positions[index];

		// Apply the position and layer
		const angle = Math.floor(Math.random() * 5);
		this.position_set(Number(pos[0]), Number(pos[1]));
		this.layer_set(layer);
		this.animation(angle, this.settings.anim_static);

		// We have spawned, stop checking
		clearInterval(this.interval_spawn);
		this.interval_spawn = null;
	}

	// Applies the given frame and animation to the sprite
	animation(frame, duration) {
		const scale_x = this.settings.sprite.scale_x * this.settings.sprite.frames_x;
		const pos_y = this.settings.sprite.scale_y * -frame;

		// Cancel the existing animation
		if(this.data_actors_self.anim) {
			this.data_actors_self.anim.cancel();
			this.data_actors_self.anim = null;
		}

		// Play the animation for this row or show the first frame if static
		if(duration > 0) {
			this.data_actors_self.anim = this.element.animate([
				{
					backgroundPosition: px([0, pos_y])
				}, {
					backgroundPosition: px([scale_x, pos_y])
				}
			], {
				duration: duration * 1000,
				direction: "normal",
				easing: "steps(" + this.settings.sprite.frames_x + ")",
				iterations: Infinity
			});
			this.data_actors_self.anim.play();
		} else {
			this.element.style.backgroundPosition = px([0, pos_y]);
		}
	}

	// Applies surface effects to the actor from the topmost surface we're about to touch given our current velocity
	surface_update() {
		// The position we're interested in checking is the actor's current position plus the desired offsets
		// We want to predict movements per direction, store bounding boxes with the X and Y offsets separately
		// Position: 0 = x, 1 = y
		// Box: 0 = left, 1 = top, 2 = right, 3 = bottom
		// Tile: 0 = left, 1 = top, 2 = right, 3 = bottom, 4 = flags
		const height = this.data_actors_self.layer;
		const pos = this.data_actors_self.pos;
		const box = this.data_actors_self.box;
		const vel = this.data_actors_self.vel;
		const ofs_x = [pos[0] + box[0] + vel[0], pos[1] + box[1], pos[0] + box[2] + vel[0], pos[1] + box[3]];
		const ofs_y = [pos[0] + box[0], pos[1] + box[1] + vel[1], pos[0] + box[2], pos[1] + box[3] + vel[1]];

		var solid_x = true;
		var solid_y = true;
		var layer = null;
		var layer_path = false;
		var flags = null;

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
				// If the actor is standing on a path tile all floors become valid
				flags = tile[4];
				layer = layers;
				if(this.flag("path", flags) > 0)
					layer_path = true;

				// We're colliding if this is either a solid tile, or a non-solid one from another layer unless we have a path
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

		// Apply changes to the actor based on what we determined
		if(solid_x)
			this.data_actors_self.vel[0] = 0;
		if(solid_y)
			this.data_actors_self.vel[1] = 0;
		if(layer_path && layer)
			this.layer_set(layer);
		if(flags)
			this.data_actors_self.flags = flags;
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
		if(!isNaN(x))
			this.data_actors_self.acc[0] = x;
		if(!isNaN(y))
			this.data_actors_self.acc[1] = y;

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.velocity_update.bind(this), WORLD_RATE);
	}

	// Runs each frame when a velocity is set to preform updates, turns itself off once movement stops
	velocity_update() {
		// Apply acceleration
		this.data_actors_self.vel[0] += this.data_actors_self.acc[0];
		this.data_actors_self.vel[1] += this.data_actors_self.acc[1];

		// Apply surface effects from the topmost tile we're about to touch this call
		this.surface_update();

		// Amount by which to convert the velocity to a change in position, halved by default
		// This must never be larger than the velocity, if it passes zero and flips signs the actor would reverse direction instead of stopping
		var transfer_x = this.data_actors_self.vel[0] / 2;
		var transfer_y = this.data_actors_self.vel[1] / 2;

		// Apply the transition to the new position of the actor
		const pos_x = this.data_actors_self.pos[0] + transfer_x;
		const pos_y = this.data_actors_self.pos[1] + transfer_y;
		this.position_set(pos_x, pos_y);

		// Determine the friction this actor is experiencing based on the surface they're moving on
		// We lose the transition amount from the velocity based on friction
		const friction = this.flag("friction", this.data_actors_self.flags);
		this.data_actors_self.vel[0] -= transfer_x * friction;
		this.data_actors_self.vel[1] -= transfer_y * friction;

		// Stop movement updates once we reach the threshold for physics sleeping
		if(Math.abs(this.data_actors_self.vel[0]) <= ACTOR_VELOCITY_SLEEP)
			this.data_actors_self.vel[0] = 0;
		if(Math.abs(this.data_actors_self.vel[1]) <= ACTOR_VELOCITY_SLEEP)
			this.data_actors_self.vel[1] = 0;
		if(this.data_actors_self.vel[0] == 0 && this.data_actors_self.vel[1] == 0) {
			clearInterval(this.interval_velocity);
			this.interval_velocity = null;
		}

		// Update the sprite angle and animation speed based on our current velocity
		// Changing animation speed each frame would reset the animation, speeds are thus stepified to snap to a grid unit
		// Angle is calculated from velocity when it's above zero, otherwise acceleration so we can turn around while standing
		// TODO: Is it possible to dynamically update CSS animation duration without resetting it? The stepping system could then be removed
		const movement_base = Math.max(Math.abs(this.data_actors_self.vel[0]), Math.abs(this.data_actors_self.vel[1]));
		const movement = Math.round(movement_base / ACTOR_VELOCITY_STEP) * ACTOR_VELOCITY_STEP;
		const angle_vel = movement > 0 ? this.data_actors_self.vel : this.data_actors_self.acc;
		const angle = vec2ang(vector(angle_vel));
		if(this.data_actors_self.movement != movement || this.data_actors_self.angle != angle) {
			if(!isNaN(angle))
				this.data_actors_self.angle = angle;
			if(movement >= 0)
				this.data_actors_self.movement = movement;

			// Speed is the velocity multiplied by the actor's animation setting when moving, idle setting if standing
			const duration = movement > 0 ? 1 / movement * this.settings.anim_moving : this.settings.anim_static;
			this.animation(this.data_actors_self.angle, duration);
		}
	}

	// Teleports the actor to this position
	position_set(x, y) {
		this.data_actors_self.pos = [x, y];

		// Offset the sprite so that the pivot point is centered horizontally and at the bottom vertically
		this.element.style.left = this.data_actors_self.pos[0] - this.settings.sprite.scale_x / 2;
		this.element.style.top = this.data_actors_self.pos[1] - this.settings.sprite.scale_y;

		// If this actor has the camera grabbed set a new camera position
		if(this.camera && !this.interval_camera)
			this.interval_camera = setInterval(this.camera_update.bind(this), WORLD_RATE);
	}

	// Sets the solidity level of this actor
	layer_set(layer) {
		this.data_actors_self.layer = layer;
		this.element.style.zIndex = this.data_actors_self.layer;

		// If this actor has the camera grabbed set a new camera position
		if(this.camera && !this.interval_camera)
			this.interval_camera = setInterval(this.camera_update.bind(this), WORLD_RATE);
	}
}
