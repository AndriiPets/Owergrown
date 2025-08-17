import "./kaplay.ts";
import "./assets.ts";
import "./scenes/loader.ts";
import "./scenes/game.ts";

scene("reset", () => {
	go("game");
});

go("loader");
