import { Vec2 } from "kaplay";

export function spawnBloodParticle(position: Vec2) {
	const particle = add([
		circle(7),
		outline(2, BLACK),
		pos(position),
		anchor("center"),
		scale(rand(0.5, 1)),
		area({ collisionIgnore: ["blood", "enemy", "player"] }),
		body(),
		opacity(1),
		lifespan(3),
		move(choose([LEFT, RIGHT]), rand(60, 240)),
		"blood",
	]);

	particle.onAdd(() => particle.jump(rand(60, 240)));
	return particle;
}
