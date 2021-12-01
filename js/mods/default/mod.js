// Brush overlays, background
const overlay_background = {
	image: "backgrounds/clouds.png",
	color: "#4fdfff",
	alpha: 1,
	scale: 16,
	scroll_x: 50,
	scroll_y: 0,
	fixed: -1
};

// Brush overlays, foreground
const overlay_foreground = {
	image: "backgrounds/clouds_shadow.png",
	alpha: 0.1,
	scale: 16,
	scroll_x: 100,
	scroll_y: 0,
	fixed: 0
};

// Brush overlays, fog
const overlay_fog = {
	color: "#dfefff",
	alpha: 0.05,
	fixed: 0
};

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
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([3, 0], [0, 24], ["grass", "terrain"], 1),
			overlays: [overlay_background, overlay_fog]
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([0, 18], [0, 24], ["dirt", "road"], 0),
			overlays: undefined
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([0, 0], [0, 24], ["grass", "terrain"], 3),
			overlays: [overlay_foreground, overlay_fog]
		}
	]
};

const tileset_outdoor_terrain_2 = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([6, 0], [3, 24], ["grass", "terrain"], 1),
			overlays: [overlay_background, overlay_fog]
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([3, 18], [3, 24], ["dirt", "road"], 0),
			overlays: undefined
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([6, 0], [3, 24], ["grass", "terrain"], 3),
			overlays: [overlay_foreground, overlay_fog]
		}
	]
};

const map_outdoor_1 = {
	temp_min: -1,
	temp_max: 0,
	perspective: 0.1,
	bound: true,
	tileset: tileset_outdoor_terrain_1
};

const map_outdoor_2 = {
	temp_min: 0,
	temp_max: 1,
	perspective: 0.1,
	bound: true,
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
