// Overlays for outdoor map
const overlays_outdoor = [
	{
		image: "backgrounds/clouds.png",
		scale: 512,
		top: false,
		scroll_x: 50,
		scroll_y: 0
	},
	{
		color: "#4fdfffef",
		top: false
	}
];

// Flags for character actors
const flags_actor_character = {
	spawn: {
		dirt: 1
	},
	solid: {
		wall: 1
	},
	path: {
		path: 1
	},
	road: {
		road: 1
	},
	friction: {
		path: 1,
		cave: 0.5,
		grass: 0.625,
		dirt: 0.5,
		stone: 0.5
	}
};

const tileset_outdoor_terrain_1 = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([3, 0], [0, 24], ["grass", "terrain"], 1)
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([0, 18], [0, 24], ["dirt", "road"], 0)
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([0, 0], [0, 24], ["grass", "terrain"], 3)
		}
	]
};

const tileset_outdoor_terrain_2 = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	fog: "#dfefff0f",
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([6, 0], [3, 24], ["grass", "terrain"], 1)
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([3, 18], [3, 24], ["dirt", "road"], 0)
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([6, 0], [3, 24], ["grass", "terrain"], 3)
		}
	]
};

const map_outdoor_1 = {
	temp_min: -1,
	temp_max: 0,
	perspective: 0.1,
	bound: true,
	overlays: overlays_outdoor,
	tileset: tileset_outdoor_terrain_1
};

const map_outdoor_2 = {
	temp_min: 0,
	temp_max: 1,
	perspective: 0.1,
	bound: true,
	overlays: overlays_outdoor,
	tileset: tileset_outdoor_terrain_2
};

const map_group_outdoor = {
	scale_x: 1024,
	scale_y: 1024,
	maps_x: 4,
	maps_y: 4,
	height: 0,
	maps: ["outdoor_1", "outdoor_2"]
}

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

world.register_data_map("outdoor_1", map_outdoor_1);
world.register_data_map("outdoor_2", map_outdoor_2);
world.register_data_actor("player", actor_player);
world.spawn_map_group(map_group_outdoor);
world.spawn_actor_player("player");
