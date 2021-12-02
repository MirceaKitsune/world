// Flags for character actors
const flags_actor_character = {
	spawn: {
		road: 1
	},
	solid: {
		solid: 1,
		wall: 1
	},
	climbable: {
		path: 1
	},
	transport: {
		road: 1
	},
	transport_up: {
		cave_out: 1
	},
	transport_down: {
		cave_in: 1
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
