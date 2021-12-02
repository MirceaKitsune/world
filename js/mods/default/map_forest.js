// Brush overlays, fog
const overlay_fog_forest = {
	color: "#7fdfbf",
	alpha: 0.05
};

// Brush overlays, fog
const overlay_fog_forest_cave = {
	color: "#2f2f2f",
	alpha: 0.1
};

const tileset_forest = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([6, 0], [3, 24], ["grass", "terrain"], 1, false),
			overlays: [overlay_background, overlay_fog_forest]
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([3, 18], [3, 24], ["dirt", "road"], 0, false),
			overlays: undefined
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([6, 0], [3, 24], ["grass", "terrain"], 4, false),
			overlays: [overlay_foreground, overlay_fog_forest]
		}
	]
};

const tileset_forest_cave = {
	image: "tilesets/lpc_terrain.png",
	size: 32,
	brushes: [
		// Terrain, base
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([3, 18], [3, 24], ["grass", "terrain"], 1, true),
			overlays: [overlay_background_cave, overlay_fog_forest_cave]
		},
		// Road
		{
			noise: lpc_noise_road,
			tiles: lpc_tileset([12, 18], [3, 24], ["dirt", "road"], 0, true),
			overlays: undefined
		},
		// Terrain, 1st island
		{
			noise: lpc_noise_terrain,
			tiles: lpc_tileset([3, 12], [3, 24], ["grass", "terrain"], 3, true),
			overlays: [overlay_foreground_cave, overlay_fog_forest_cave]
		}
	]
};

const map_forest = {
	temp_min: 0,
	temp_max: 1,
	perspective: 0.1,
	bound: true,
	tileset: tileset_forest
};

const map_forest_cave = {
	temp_min: 0,
	temp_max: 1,
	perspective: 0.1,
	bound: true,
	tileset: tileset_forest_cave
};

world.register_data_map("outdoor_forest", map_forest);
world.register_data_map("outdoor_forest_cave", map_forest_cave);
