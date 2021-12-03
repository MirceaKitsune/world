// Noise function for this map
const noise_group_forest = function(x, y, z) {
	const noise = noise_terrain(x, y);
	return noise > 0.5 && noise <= 1;
}

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

const brushes_forest = [
	// Terrain, base
	{
		image: "tilesets/lpc_terrain.png",
		height: 0,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([6, 0], [3, 30], ["grass", "terrain"], 1, false),
		overlays: [overlay_background, overlay_fog_forest]
	},
	// Road
	{
		image: "tilesets/lpc_terrain.png",
		height: 1,
		noise: lpc_noise_road,
		tiles: lpc_tileset([3, 18], [3, 30], ["dirt", "road"], 0, false),
		overlays: undefined
	},
	// Terrain, 1st island
	{
		image: "tilesets/lpc_terrain.png",
		height: 1,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([6, 0], [3, 30], ["grass", "terrain"], 4, false),
		overlays: [overlay_foreground, overlay_fog_forest]
	}
];

const brushes_forest_cave = [
	// Terrain, base
	{
		image: "tilesets/lpc_terrain.png",
		height: 0,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([3, 18], [3, 30], ["dirt", "terrain"], 1, false),
		overlays: [overlay_background_cave, overlay_fog_forest_cave]
	},
	// Terrain, 1st island
	{
		image: "tilesets/lpc_terrain.png",
		height: 1,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([3, 24], [3, 30], ["stone", "terrain"], 4, true),
		overlays: [overlay_foreground_cave, overlay_fog_forest_cave]
	}
];

const map_forest = {
	noise: noise_group_forest,
	perspective: 0.1,
	bound: true,
	size: 32,
	brushes: brushes_forest
};

const map_forest_cave = {
	noise: noise_group_forest,
	perspective: 0.1,
	bound: true,
	size: 32,
	brushes: brushes_forest_cave
};

world.register_data_map("outdoor_forest", map_forest);
world.register_data_map("outdoor_forest_cave", map_forest_cave);
