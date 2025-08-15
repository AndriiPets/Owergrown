import kaplay from "kaplay";
import "kaplay/global";

kaplay({
	width: 480,
	height: 640,
	letterbox: true,
	touchToMouse: true,
	debug: true,
	buttons: {
		moveLeft: {
			keyboard: ["left", "a"],
		},
		moveRight: {
			keyboard: ["right", "d"],
		},
		jump: {
			keyboard: ["space", "z"],
		},
	},
});
