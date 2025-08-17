import { Vec2 } from "kaplay";
import { spin, bounce } from "../components.ts";

export function spawnPlatform(position: Vec2) {
	const platform = add([
		sprite("flower"),
		anchor("center"),
		pos(position),
		area(),
		body({ isStatic: true }),
		offscreen({ destroy: true }),
		scale(1),
		bounce(),
		"platform",
	]);

	platform.onAdd(() => {
		platform.bounce();
	});

	platform.onCollide("player", () => {
		platform.bounce();
	});

	return platform;
}
