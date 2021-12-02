// Map group for the outdoor areas
const map_group_nature = {
	scale_x: 1024,
	scale_y: 1024,
	maps_x: 4,
	maps_y: 4,
	height: 0,
	maps: ["outdoor_plains", "outdoor_forest"]
}

// Map group for the cave areas
const map_group_nature_cave = {
	scale_x: 1024,
	scale_y: 1024,
	maps_x: 4,
	maps_y: 4,
	height: -1,
	maps: ["outdoor_plains_cave", "outdoor_forest_cave"]
}

world.spawn_map_group(map_group_nature);
world.spawn_map_group(map_group_nature_cave);
