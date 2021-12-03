// Noise function for this map
const noise_group_plains = function(x, y, z) {
	const noise = noise_terrain(x, y);
	return noise > 0 && noise <= 0.5;
}

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

const brushes_plains = [
	// Terrain, base
	{
		image: "tilesets/lpc_terrain.png",
		height: 0,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([3, 0], [0, 30], ["grass", "terrain"], 1, false),
		overlays: [overlay_background, overlay_fog_plains]
	},
	// Road
	{
		image: "tilesets/lpc_terrain.png",
		height: 1,
		noise: lpc_noise_road,
		tiles: lpc_tileset([0, 18], [0, 30], ["dirt", "road"], 0, false),
		overlays: undefined
	},
	// Terrain, 1st island
	{
		image: "tilesets/lpc_terrain.png",
		height: 1,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([0, 0], [0, 30], ["grass", "terrain"], 3, false),
		overlays: [overlay_foreground, overlay_fog_plains]
	}
];

const brushes_plains_cave = [
	// Terrain, base
	{
		image: "tilesets/lpc_terrain.png",
		height: 0,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([0, 18], [0, 30], ["dirt", "terrain"], 1, false),
		overlays: [overlay_background_cave, overlay_fog_plains_cave]
	},
	// Terrain, 1st island
	{
		image: "tilesets/lpc_terrain.png",
		height: 1,
		noise: lpc_noise_terrain,
		tiles: lpc_tileset([0, 24], [0, 30], ["stone", "terrain"], 3, true),
		overlays: [overlay_foreground_cave, overlay_fog_plains_cave]
	}
];

const map_plains = {
	noise: noise_group_plains,
	perspective: 0.1,
	bound: true,
	size: 32,
	brushes: brushes_plains
};

const map_plains_cave = {
	noise: noise_group_plains,
	perspective: 0.1,
	bound: true,
	size: 32,
	brushes: brushes_plains_cave
};

world.register_data_map("outdoor_plains", map_plains);
world.register_data_map("outdoor_plains_cave", map_plains_cave);
