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
		moveUp: {
			keyboard: ["up", "w"],
		},
		moveDown: {
			keyboard: ["down", "s"],
		},
		jump: {
			keyboard: ["space", "z"],
		},
		shoot: {
			keyboard: ["x"],
		},
		pause: {
			keyboard: ["escape"],
		},
	},
});
