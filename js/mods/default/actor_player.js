// Flags for character actors
const flags_actor_character = {
	spawn: {
		road: true
	},
	walkable: {
		path: true,
		gravel: true,
		floor: true,
		cave_out: [true, false, true, false],
		cave_in: [true, false, true, false]
	},
	climbable: {
		path: true
	},
	transportable: {
		floor: true
	},
	transport: {
		road: true
	},
	transport_up: {
		cave_out: true
	},
	transport_down: {
		cave_in: true
	},
	friction: {
		path: 1,
		cave: 0.5,
		gravel: 0.75,
		grass: 0.625,
		dirt: 0.5,
		stone: 0.5
	}
};

const actor_player = {
	acceleration: 0.5,
	anim_moving: 1,
	anim_static: 0,
	box: [-8, -8, 8, 8],
	flags: flags_actor_character,
	sprite: {
		image: "sprites/hero.png",
		scale_x: 24,
		scale_y: 32,
		frames_x: 4,
		frames_y: 4
	}
};

world.register_data_actor("player", actor_player);
world.spawn_actor_player("player");
