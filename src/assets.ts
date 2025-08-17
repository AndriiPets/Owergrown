loadRoot("./"); // A good idea for Itch.io publishing later
loadSprite("bean", "sprites/player.png").onError((err) => {
	debug.log(err);
});

loadSprite("default_map", "maps/default_map.png");
loadSprite("background", "sprites/moonbg.png");
loadSprite("flower", "sprites/flower.png");

for (let i = 1; i < 22; i++) {
	loadSprite(`chunk_${i}`, `maps/chunk_${i}.png`);
}

loadSprite("tileset", "tileset/tilemap.png", {
	// Tell Kaplay the dimensions of one tile in the grid
	sliceX: 20,
	sliceY: 20,
	// Define all animations here
	anims: {
		// name the animations "enemy_move" and "turret_idle"
		player_jump: 303,
		player_idle: 301,
		player_move: { from: 303, to: 304, speed: 4, loop: true },
		enemy_move: { from: 340, to: 341, speed: 4, loop: true },
		turret_idle: { from: 380, to: 381, speed: 2, loop: true }, // Frame 401 is out of bounds, using 380-381
	},
});
