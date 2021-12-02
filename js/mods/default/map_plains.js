// Brush overlays, fog
const overlay_fog_plains = {
	color: "#dfefff",
	alpha: 0.05
};

// Brush overlays, fog
const overlay_fog_plains_cave = {
	color: "#2f2f2f",
	alpha: 0.1
};

const tileset_plains = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([3, 0], [0, 30], ["grass", "terrain"], 1, false),
			overlays: [overlay_background, overlay_fog_plains]
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([0, 18], [0, 30], ["dirt", "road"], 0, false),
			overlays: undefined
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([0, 0], [0, 30], ["grass", "terrain"], 3, false),
			overlays: [overlay_foreground, overlay_fog_plains]
		}
	]
};

const tileset_plains_cave = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([0, 18], [0, 30], ["dirt", "terrain"], 1, false),
			overlays: [overlay_background_cave, overlay_fog_plains_cave]
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([12, 18], [0, 30], ["dirt", "road"], 0, false),
			overlays: undefined
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([0, 24], [0, 30], ["stone", "terrain"], 3, true),
			overlays: [overlay_foreground_cave, overlay_fog_plains_cave]
		}
	]
};

const map_plains = {
	temp_min: -1,
	temp_max: 0,
	perspective: 0.1,
	bound: true,
	tileset: tileset_plains
};

const map_plains_cave = {
	temp_min: -1,
	temp_max: 0,
	perspective: 0.1,
	bound: true,
	tileset: tileset_plains_cave
};

world.register_data_map("outdoor_plains", map_plains);
world.register_data_map("outdoor_plains_cave", map_plains_cave);
