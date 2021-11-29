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
		this.data.anim = null;

		// Private data which shouldn't need to be accessed by other instances or classes
		// TODO: We use an interval to check for spawn because actors may load before tiles, fix this by guaranteeing proper load order
		this.interval_velocity = null;
		this.interval_camera = null;
		this.interval_spawn = setInterval(this.spawn.bind(this), WORLD_RATE);
		this.timeout_map = null;
		this.map = null;
		this.camera = false;
		this.camera_pos = [undefined, undefined, undefined];

		// The image file used by this actor, prepares the image and runs the main function once it loads
		this.image = new Image();
		this.image.src = PATH_IMAGES + this.settings.sprite.image;
		this.image.onload = this.onload.bind(this);

		// Create the actor element and append it to the parent element
		this.element = html_create("div");
		html_set(this.element, "class", "sprite");

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
		html_css(this.element, "backgroundImage", "url(" + this.image.src + ")");
		html_css(this.element, "backgroundSize", px([this.settings.sprite.scale_x * this.settings.sprite.frames_x, this.settings.sprite.scale_y * this.settings.sprite.frames_y]));
		html_css(this.element, "width", px([this.settings.sprite.scale_x]));
		html_css(this.element, "height", px([this.settings.sprite.scale_y]));

		this.init();
	}

	// Removes the actor from the old map and attach it to the new one
	map_set(map, x, y) {
		// Detach this actor from the previous map
		if(this.map) {
			html_parent(this.element, this.map.element_view, false);
			if(this.camera)
				this.map.deactivate();
		}

		// Set the new map and relevant effects
		this.map = map;
		this.position_set(x, y);
		this.camera_pos = [undefined, undefined, undefined];

		// Attach the actor to the new map
		html_parent(this.element, this.map.element_view, true);
		if(this.camera)
			this.map.activate();
	}

	// Determines if the current map should transport us to another map based on our location
	map_move() {
		// We require a current map to check for other maps it could lead to
		if(!this.map)
			return;

		// Check which map edges we are touching, movement direction is also accounted for here
		// Angle, clockwise direction: 0 = top, 1 = right, 2 = bottom, 3 = left
		const touching = [
			this.data.vel[1] < 0 && this.data.pos[1] <= 0,
			this.data.vel[0] > 0 && this.data.pos[0] >= this.map.scale.x,
			this.data.vel[1] > 0 && this.data.pos[1] >= this.map.scale.y,
			this.data.vel[0] < 0 && this.data.pos[0] <= 0
		];
		if(!touching[0] && !touching[1] && !touching[2] && !touching[3])
			return;

		// Determine the grid position of the map we should move to from this direction
		var grid_x = this.map.grid.x;
		var grid_y = this.map.grid.y;
		if(touching[0])
			grid_y -= 1;
		if(touching[1])
			grid_x += 1;
		if(touching[2])
			grid_y += 1;
		if(touching[3])
			grid_x -= 1;

		// Fetch the map at this grid position if one exists
		const grid = vector([grid_x, grid_y, this.map.grid.z]);
		const map = this.world.map_at_grid(grid);
		if(!map)
			return;

		// Determine the position to apply to the player so they correctly come out the other end
		var pos_x = this.data.pos[0];
		var pos_y = this.data.pos[1];
		if(touching[0])
			pos_y = map.scale.y;
		if(touching[1])
			pos_x = 0;
		if(touching[2])
			pos_y = 0;
		if(touching[3])
			pos_x = map.scale.x;

		// Check if we have a valid road tile at the current location on the same layer
		var has_old = false;
		const box_old = [this.data.pos[0] + this.data.box[0], this.data.pos[1] + this.data.box[1], this.data.pos[0] + this.data.box[2], this.data.pos[1] + this.data.box[3]];
		for(let tile of this.map.tileset.layers[this.data.layer])
			if(intersects(box_old, tile))
				has_old = this.flag("road", tile[4]) > 0;
		if(!has_old)
			return

		// Check if we have a valid road tile at the new location on the same layer
		var has_new = false;
		const box_new = [pos_x + this.data.box[0], pos_y + this.data.box[1], pos_x + this.data.box[2], pos_y + this.data.box[3]];
		for(let tile of map.tileset.layers[this.data.layer])
			if(intersects(box_new, tile))
				has_new = this.flag("road", tile[4]) > 0;
		if(!has_new)
			return

		// Set timeout and transition effects for changing the map
		if(!this.timeout_map) {
			this.world.set_tint(false, ACTOR_TRANSITION_TIME / 2);
			this.timeout_map = setTimeout(function() {
				this.map_set(map, pos_x, pos_y);
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
		html_css(this.map.element_view, "transform", "perspective(0px) translate3d(" + this.camera_pos[0] + "px, " + this.camera_pos[1] + "px, " + this.camera_pos[2] + "px)");
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
		for(let layers in this.map.tileset.layers) {
			for(let tile of this.map.tileset.layers[layers]) {
				// We want the position to be the center of the tile
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
		if(Object.keys(positions).length == 0)
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
		if(this.data.anim) {
			this.data.anim.cancel();
			this.data.anim = null;
		}

		// Play the animation for this row or show the first frame if static
		if(duration > 0) {
			this.data.anim = this.element.animate([
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
		} else {
			html_css(this.element, "backgroundPosition", px([0, pos_y]));
		}
	}

	// Applies surface effects to the actor from the topmost surface we're about to touch given our current velocity
	surface_update() {
		// No movement means there's no collision to check for
		if(this.data.vel[0] == 0 && this.data.vel[1] == 0)
			return;

		// The position we're interested in checking is the actor's current position plus the desired offsets
		// We want to predict movements per direction, store bounding boxes with the X and Y offsets separately
		// Position: 0 = x, 1 = y
		// Box: 0 = left, 1 = top, 2 = right, 3 = bottom
		// Tile: 0 = left, 1 = top, 2 = right, 3 = bottom, 4 = flags
		const box_x = [this.data.pos[0] + this.data.box[0] + this.data.vel[0], this.data.pos[1] + this.data.box[1], this.data.pos[0] + this.data.box[2] + this.data.vel[0], this.data.pos[1] + this.data.box[3]];
		const box_y = [this.data.pos[0] + this.data.box[0], this.data.pos[1] + this.data.box[1] + this.data.vel[1], this.data.pos[0] + this.data.box[2], this.data.pos[1] + this.data.box[3] + this.data.vel[1]];

		var solid_x = true;
		var solid_y = true;
		var layer = null;
		var layer_path = false;
		var flags = null;

		// Go through the tiles on each layer and pick relevant data from tiles who's boundaries the actor is within
		// This relies on layers being scanned in bottom to top order, topmost entries must be allowed to override lower ones
		for(let layers in this.map.tileset.layers) {
			for(let tile of this.map.tileset.layers[layers]) {
				const touching_x = intersects(box_x, tile);
				const touching_y = intersects(box_y, tile);
				if(!touching_x && !touching_y)
					continue;

				// Remember the last target layer we touched and inherit its flags
				// If the actor is standing on a path tile all floors become valid targets
				flags = tile[4];
				if(this.flag("path", flags) > 0)
					layer_path = true;
				else
					layer = layers;

				// We're colliding if this is either a solid tile, or a non-solid one from another layer unless we have a path
				// The topmost surface is counted so a later iteration may override this decision
				if(this.flag("solid", flags) > 0) {
					if(touching_x)
						solid_x = true;
					if(touching_y)
						solid_y = true;
				} else {
					if(touching_x)
						solid_x = layers != this.data.layer && !layer_path;
					if(touching_y)
						solid_y = layers != this.data.layer && !layer_path;
				}
			}
		}

		// Apply changes to the actor based on what we determined
		if(solid_x)
			this.data.vel[0] = 0;
		if(solid_y)
			this.data.vel[1] = 0;
		if(layer_path && layer)
			this.layer_set(layer);
		if(flags)
			this.data.flags = flags;
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
		this.map_move();

		// Amount by which to convert velocity to a change in position, halved per call by default
		// This must never be larger than the velocity itself, if it passes zero and flips signs the actor will reverse direction instead of stopping
		const transfer_x = this.data.vel[0] / 2;
		const transfer_y = this.data.vel[1] / 2;
		this.position_set(this.data.pos[0] + transfer_x, this.data.pos[1] + transfer_y);

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

	// Teleports the actor to this position
	position_set(x, y) {
		// Offset the sprite so that the pivot point is centered horizontally and at the bottom vertically
		this.data.pos = [x, y];
		html_css(this.element, "left", this.data.pos[0] - this.settings.sprite.scale_x / 2);
		html_css(this.element, "top", this.data.pos[1] - this.settings.sprite.scale_y);

		// If this actor has the camera grabbed set a new camera position
		if(this.camera && !this.interval_camera)
			this.interval_camera = setInterval(this.camera_update.bind(this), WORLD_RATE);
	}

	// Sets the solidity level of this actor
	layer_set(layer) {
		this.data.layer = layer;
		html_css(this.element, "zIndex", this.data.layer);

		// If this actor has the camera grabbed set a new camera position
		if(this.camera && !this.interval_camera)
			this.interval_camera = setInterval(this.camera_update.bind(this), WORLD_RATE);
	}
}
