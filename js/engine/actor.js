ACTOR_VELOCITY_SLEEP = 0.01;
ACTOR_VELOCITY_STEP = 0.25;
ACTOR_CAMERA_SLEEP_POSITION = 0.1;
ACTOR_CAMERA_SLEEP_HEIGHT = 0.001;
ACTOR_CAMERA_SPEED_POSITION = 0.05;
ACTOR_CAMERA_SPEED_HEIGHT = 0.025;
ACTOR_TRANSITION_TIME = 1;

class Actor {
	constructor(world, settings) {
		// Actors are spawned by the World class and have an instance as their parent
		this.world = world;
		this.settings = settings;

		// Prepare public data used to describe the state of this actor in the world
		this.data = {};
		this.data.box = this.settings.box;
		this.data.pos = [0, 0];
		this.data.vel = [0, 0];
		this.data.acc = [0, 0];
		this.data.flags = [];
		this.data.movement = 0;
		this.data.angle = 0;
		this.data.layer = 0;
		this.data.anim = undefined;

		// Private data which shouldn't need to be accessed by other instances or classes
		this.interval_velocity = null;
		this.interval_camera = null;
		this.timeout_map = null;
		this.map = null;
		this.camera = false;
		this.camera_pos = [undefined, undefined, undefined];

		// Create the actor element and append it to the parent element
		this.image = load_image(this.settings.sprite.image, this.onload.bind(this));
		this.element = html_create("div");
		html_set(this.element, "class", "sprite");

		// Set default layer position and angle
		this.move(0, 0, 0, 0);
	}

	// Executed when the actor was spawned, must be replaced by child classes
	init() {}

	// Executed when the sprite image finishes loading, calls the init function
	onload() {
		// Set the sprite of this actor on the element
		html_css(this.element, "backgroundImage", "url(" + this.image.src + ")");
		html_css(this.element, "backgroundSize", px(this.settings.sprite.scale_x * this.settings.sprite.frames_x) + " " + px(this.settings.sprite.scale_y * this.settings.sprite.frames_y));
		html_css(this.element, "width", px(this.settings.sprite.scale_x));
		html_css(this.element, "height", px(this.settings.sprite.scale_y));

		this.init();
	}

	// Changes the position layer or angle of the actor
	move(x, y, layer, angle) {
		// Set the x position, sprite pivot is located at the center
		if(!isNaN(x)) {
			this.data.pos[0] = x;
			html_css(this.element, "left", this.data.pos[0] - this.settings.sprite.scale_x / 2);
		}

		// Set the y position, sprite pivot is located at the bottom
		if(!isNaN(y)) {
			this.data.pos[1] = y;
			html_css(this.element, "top", this.data.pos[1] - this.settings.sprite.scale_y);
		}

		// Set the layer
		if(!isNaN(layer)) {
			this.data.layer = layer;
			html_css(this.element, "zIndex", this.data.layer);
		}

		// Set the angle, assumes the idle animation of the sprite
		if(!isNaN(angle))
			this.animation(angle, this.settings.idle);

		// If this actor has the camera grabbed initialize camera updates
		if(this.camera && !this.interval_camera)
			this.interval_camera = setInterval(this.camera_update.bind(this), WORLD_RATE);
	}

	// Removes the actor from the old map and attach it to the new one
	map_set(map) {
		// Detach this actor from the previous map
		if(this.map) {
			html_parent(this.element, this.map.element_view, false);
			if(this.camera)
				this.map.deactivate();
		}

		// Set the new map and relevant effects
		this.map = map;
		this.camera_pos = [undefined, undefined, undefined];
		this.move(0, 0, undefined, undefined);

		// Attach the actor to the new map
		html_parent(this.element, this.map.element_view, true);
		if(this.camera)
			this.map.activate();
	}

	// Takes us to another map on the map grid in the given direction
	map_set_grid(dir) {
		// Don't interrupt an existing transition
		if(this.timeout_map)
			return;

		// Determine the grid position of the map we should move to then fetch the map at that position
		const grid = vector([this.map.grid.x + dir.x, this.map.grid.y + dir.y, this.map.grid.z + dir.z]);
		const map = this.world.map_at_grid(grid);
		if(!map)
			return;

		// Determine the position at which the actor would come out the other end
		var target_check_x = this.data.pos[0];
		var target_check_y = this.data.pos[1];
		if(dir.x < 0)
			target_check_x = map.scale.x;
		if(dir.x > 0)
			target_check_x = 0;
		if(dir.y < 0)
			target_check_y = map.scale.y;
		if(dir.y > 0)
			target_check_y = 0;
		const target_box = [target_check_x + this.data.box[0], target_check_y + this.data.box[1], target_check_x + this.data.box[2], target_check_y + this.data.box[3]];

		// Find the transport tile being touched by the actor at the desired location, pick the best neighboring position from the valid tiles found
		// Position: 0 = x, 1 = y, 2 = layer, 3 = angle
		var target = undefined;
		for(let layers in map.tileset.layers) {
			for(let tile of map.tileset.layers[layers]) {
				const tile_flag = this.flag("transport", tile[2]) || this.flag("transport_up", tile[2]) || this.flag("transport_down", tile[2]);
				const tile_box = box(tile[0], tile[1], map.tileset.size);
				if(tile_flag && box_intersects(target_box, tile_box)) {
					var target_pos = undefined;
					var target_pos_up = undefined;
					var target_pos_down = undefined;
					var target_pos_left = undefined;
					var target_pos_right = undefined;
					for(let tile_target of map.tileset.layers[layers]) {
						const tile_target_flag = this.flag("transportable", tile_target[2]);
						if(tile_target[0] == tile[0] && tile_target[1] == tile[1])
							target_pos = tile_target_flag ? [tile_target[0], tile_target[1]] : undefined;
						if(tile_target[0] == tile[0] && tile_target[1] == tile[1] - 1)
							target_pos_up = tile_target_flag ? [tile_target[0], tile_target[1]] : undefined;
						if(tile_target[0] == tile[0] && tile_target[1] == tile[1] + 1)
							target_pos_down = tile_target_flag ? [tile_target[0], tile_target[1]] : undefined;
						if(tile_target[0] == tile[0] - 1 && tile_target[1] == tile[1])
							target_pos_left = tile_target_flag ? [tile_target[0], tile_target[1]] : undefined;
						if(tile_target[0] == tile[0] + 1 && tile_target[1] == tile[1])
							target_pos_right = tile_target_flag ? [tile_target[0], tile_target[1]] : undefined;
					}
					const pos = target_pos || target_pos_up || target_pos_down || target_pos_left || target_pos_right;
					target = pos ? [(pos[0] * map.tileset.size) + (map.tileset.size / 2), (pos[1] * map.tileset.size) + (map.tileset.size / 2), layers, dir.z == 0 ? undefined : 2] : undefined;
				}
			}
		}

		// Set timeout and transition effects for changing the map
		if(target) {
			this.world.set_tint(false, ACTOR_TRANSITION_TIME / 2);
			this.timeout_map = setTimeout(function() {
				this.map_set(map);
				this.move(target[0], target[1], target[2], target[3]);
				this.world.set_tint(true, ACTOR_TRANSITION_TIME / 2);
				this.timeout_map = null;
			}.bind(this), ACTOR_TRANSITION_TIME / 2 * 1000);
		}
	}

	// Focuses the camera on the position of the actor
	camera_update() {
		// We require a map to be set in order to make changes to its element
		if(!this.map)
			return;

		// The target height is kept in 0 to 1 range for easy control against the hardcoded 0px perspective: 0 is no zoom, 0.5 is double, etc
		// Its value is never allowed to reach 1 by design as that would produce infinite zoom
		var target_x = (this.map.scale.x / 2) - this.data.pos[0];
		var target_y = (this.map.scale.y / 2) - this.data.pos[1];
		var target_z = 1 - 1 / (WORLD_ZOOM + (this.data.layer * this.map.settings.perspective));

		// If this map requests binding the camera, make sure the view can't poke past the map edges
		if(this.map.settings.bound) {
			const bound_x = (this.map.scale.x / 2) - (WORLD_RESOLUTION_X / 2) * (1 - target_z);
			const bound_y = (this.map.scale.y / 2) - (WORLD_RESOLUTION_Y / 2) * (1 - target_z);
			target_x = Math.min(Math.max(target_x, -bound_x), bound_x);
			target_y = Math.min(Math.max(target_y, -bound_y), bound_y);
		}

		// If a camera parameter wasn't previously set apply an instant update
		// Otherwise make the camera parameters slowly approach those of the target for transition effect
		// Camera position: 0 = x, 1 = y, 2 = height
		this.camera_pos[0] = isNaN(this.camera_pos[0]) ? target_x : this.camera_pos[0] + (target_x - this.camera_pos[0]) * ACTOR_CAMERA_SPEED_POSITION;
		this.camera_pos[1] = isNaN(this.camera_pos[1]) ? target_y : this.camera_pos[1] + (target_y - this.camera_pos[1]) * ACTOR_CAMERA_SPEED_POSITION;
		this.camera_pos[2] = isNaN(this.camera_pos[2]) ? target_z : this.camera_pos[2] + (target_z - this.camera_pos[2]) * ACTOR_CAMERA_SPEED_HEIGHT;

		// If the transition is close enough to the target position we can snap to it and stop running the check
		if(Math.abs(this.camera_pos[0] - target_x) < ACTOR_CAMERA_SLEEP_POSITION)
			this.camera_pos[0] = target_x;
		if(Math.abs(this.camera_pos[1] - target_y) < ACTOR_CAMERA_SLEEP_POSITION)
			this.camera_pos[1] = target_y;
		if(Math.abs(this.camera_pos[2] - target_z) < ACTOR_CAMERA_SLEEP_HEIGHT)
			this.camera_pos[2] = target_z;
		if(this.camera_pos[0] == target_x && this.camera_pos[1] == target_y && this.camera_pos[2] == target_z) {
			clearInterval(this.interval_camera);
			this.interval_camera = null;
		}

		// Apply camera position and zoom by using a translate3d CSS transform on the world element
		html_css(this.map.element_view, "transform", "perspective(0px) translate3d(" + px(this.camera_pos[0]) + ", " + px(this.camera_pos[1]) + ", " + px(this.camera_pos[2]) + ")");
	}

	// Check if a flag exists in the list and return its value if yes
	flag(category, list) {
		for(let flags in this.settings.flags[category])
			if(list.includes(flags))
				return this.settings.flags[category][flags];
		return undefined;
	}

	// Applies the given frame and animation to the sprite
	animation(frame, duration) {
		html_css(this.element, "backgroundPositionX", px(0));
		html_css(this.element, "backgroundPositionY", px(this.settings.sprite.scale_y * -frame));

		this.data.anim = html_animation_stop(this.data.anim);
		if(duration > 0)
			this.data.anim = html_animation_play(this.element, "backgroundPositionX", 0, this.settings.sprite.scale_x * this.settings.sprite.frames_x, duration, this.settings.sprite.frames_x);
	}

	// Applies surface effects to the actor from the topmost surface we're about to touch given our current velocity
	surface_update() {
		// No map or no movement means no surfaces to check for
		if(!this.map || (this.data.vel[0] == 0 && this.data.vel[1] == 0))
			return;

		// The position we're interested in checking is the actor's current position plus the desired offsets
		// We want to predict movements per direction, store bounding boxes with the X and Y offsets separately
		// Position: 0 = x, 1 = y
		// Box: 0 = left, 1 = top, 2 = right, 3 = bottom
		// Tile: 0 = x, 1 = y, 2 = flags
		const box_x = [this.data.pos[0] + this.data.box[0] + this.data.vel[0], this.data.pos[1] + this.data.box[1], this.data.pos[0] + this.data.box[2] + this.data.vel[0], this.data.pos[1] + this.data.box[3]];
		const box_y = [this.data.pos[0] + this.data.box[0], this.data.pos[1] + this.data.box[1] + this.data.vel[1], this.data.pos[0] + this.data.box[2], this.data.pos[1] + this.data.box[3] + this.data.vel[1]];

		var solid_x = true;
		var solid_y = true;
		var layer = null;
		var layer_path = false;
		var flags = null;
		var transport_dir = vector([0, 0, 0]);

		// Go through the tiles on each layer and pick relevant data from tiles who's boundaries the actor is within
		// This relies on layers being scanned in bottom to top order, topmost entries must be allowed to override lower ones
		for(let layers in this.map.tileset.layers) {
			for(let tile of this.map.tileset.layers[layers]) {
				const tile_box = box(tile[0], tile[1], this.map.tileset.size);
				const touching_x = box_intersects(box_x, tile_box);
				const touching_y = box_intersects(box_y, tile_box);
				if(!touching_x && !touching_y)
					continue;
				flags = tile[2];

				// Check if the actor is touching a tile that should transport us to another map
				// Transport tiles must be at the top, they become invalid when covered
				// Horizontal transports are based on which map edges we're touching
				transport_dir = vector([0, 0, 0]);
				if(this.flag("transport", flags)) {
					if(this.data.pos[0] <= 0)
						transport_dir.x = -1;
					if(this.data.pos[0] >= this.map.scale.x)
						transport_dir.x = 1;
					if(this.data.pos[1] <= 0)
						transport_dir.y = -1;
					if(this.data.pos[1] >= this.map.scale.y)
						transport_dir.y = 1;
				} else if(this.flag("transport_up", flags)) {
					transport_dir.z = 1;
				} else if(this.flag("transport_down", flags)) {
					transport_dir.z = -1;
				}

				// Remember the last target layer we touched and inherit its flags
				// If the actor is standing on a path tile all floors become valid targets
				if(this.flag("climbable", flags))
					layer_path = true;
				else
					layer = layers;

				// We're colliding if this is either a solid tile, or a non-solid one from another layer unless we have a path
				// The topmost surface is counted last so a later iteration may override this decision
				// If the surface flag is an array, movement is filtered per direction
				// Angle, clockwise direction: 0 = top, 1 = right, 2 = bottom, 3 = left
				const walk = this.flag("walkable", flags);
				const walk_dir = walk && typeof walk === "object" ? [walk[0], walk[1], walk[2], walk[3]] : [walk, walk, walk, walk];
				const walk_valid_x = (walk_dir[1] && this.data.vel[0] > 0) || (walk_dir[3] && this.data.vel[0] < 0);
				const walk_valid_y = (walk_dir[0] && this.data.vel[1] > 0) || (walk_dir[2] && this.data.vel[1] < 0);
				if(walk_valid_x || walk_valid_y) {
					if(touching_x)
						solid_x = !walk_valid_x || (layer != this.data.layer && !layer_path);
					if(touching_y)
						solid_y = !walk_valid_y || (layer != this.data.layer && !layer_path);
				} else {
					if(touching_x)
						solid_x = true;
					if(touching_y)
						solid_y = true;
				}
			}
		}

		// Apply changes to the actor based on what we determined
		if(solid_x)
			this.data.vel[0] = 0;
		if(solid_y)
			this.data.vel[1] = 0;
		if(layer_path && layer)
			this.move(undefined, undefined, layer, undefined);
		if(flags)
			this.data.flags = flags;
		if(transport_dir.x != 0 || transport_dir.y != 0 || transport_dir.z != 0)
			this.map_set_grid(transport_dir);
	}

	// Sets a velocity which is applied once, used for pushing objects
	velocity_set_impulse(x, y) {
		this.data.vel = [this.data.vel[0] + x, this.data.vel[1] + y];

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.velocity_update.bind(this), WORLD_RATE);
	}

	// Sets a velocity which is applied each frame, used for walking
	velocity_set_acceleration(x, y) {
		if(!isNaN(x))
			this.data.acc[0] = x;
		if(!isNaN(y))
			this.data.acc[1] = y;

		// Start the interval function for physics updates
		if(!this.interval_velocity)
			this.interval_velocity = setInterval(this.velocity_update.bind(this), WORLD_RATE);
	}

	// Runs each frame when a velocity is set to preform updates, turns itself off once movement stops
	velocity_update() {
		// Apply acceleration then set surface effects for the tiles we're about to touch at our new velocity
		this.data.vel[0] += this.data.acc[0];
		this.data.vel[1] += this.data.acc[1];
		this.surface_update();

		// Amount by which to convert velocity to a change in position, halved per call by default
		// This must never be larger than the velocity itself, if it passes zero and flips signs the actor will reverse direction instead of stopping
		const transfer_x = this.data.vel[0] / 2;
		const transfer_y = this.data.vel[1] / 2;
		this.move(this.data.pos[0] + transfer_x, this.data.pos[1] + transfer_y, undefined, undefined);

		// Determine the friction this actor is experiencing based on the surface they're moving on
		// We lose the transition amount from the velocity based on friction
		const friction = this.flag("friction", this.data.flags);
		this.data.vel[0] -= transfer_x * friction;
		this.data.vel[1] -= transfer_y * friction;

		// Stop movement updates once we reach the threshold for physics sleeping
		if(Math.abs(this.data.vel[0]) <= ACTOR_VELOCITY_SLEEP)
			this.data.vel[0] = 0;
		if(Math.abs(this.data.vel[1]) <= ACTOR_VELOCITY_SLEEP)
			this.data.vel[1] = 0;
		if(this.data.vel[0] == 0 && this.data.vel[1] == 0) {
			clearInterval(this.interval_velocity);
			this.interval_velocity = null;
		}

		// Update the sprite angle and animation speed based on our current velocity
		// Changing animation speed each frame would reset the animation, speeds are thus stepified to snap to a grid unit
		// Angle is calculated from velocity when it's above zero, otherwise acceleration so we can turn around while standing
		const movement_base = Math.max(Math.abs(this.data.vel[0]), Math.abs(this.data.vel[1]));
		const movement = Math.round(movement_base / ACTOR_VELOCITY_STEP) * ACTOR_VELOCITY_STEP;
		const angle_vel = movement > 0 ? this.data.vel : this.data.acc;
		const angle = vec2ang(vector(angle_vel));
		if(this.data.movement != movement || this.data.angle != angle) {
			if(!isNaN(angle))
				this.data.angle = angle;
			if(movement >= 0)
				this.data.movement = movement;

			// Speed is the velocity multiplied by the actor's animation setting when moving, idle setting if standing
			const duration = movement > 0 ? 1 / movement * this.settings.anim_moving : this.settings.anim_static;
			this.animation(this.data.angle, duration);
		}
	}
}
