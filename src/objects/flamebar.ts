import { Vec2 } from "kaplay";

export function makeFlamebar(position: Vec2, angle = 0, num = 4) {
	// Create a parent game object for position and rotation
	const flameHead = make([pos(position), rotate(angle)]);

	// Add each section of flame as children
	for (let i = 0; i < num; i++) {
		flameHead.add([
			sprite("tileset", { frame: 22 }),
			//sprite("pineapple"),
			pos(0, i * 16),
			area(),
			anchor("center"),
			offscreen({ destroy: true }),
			"flame",
		]);
	}

	// The flame head's rotation will affect all its children
	flameHead.onUpdate(() => {
		flameHead.angle += dt() * 60;
	});

	return flameHead;
}
