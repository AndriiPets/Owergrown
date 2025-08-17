import { bulletData } from "../types";

export function spawnBullet(data: bulletData) {
	const bullet = add([
		circle(4),
		color(rgb(0, 0, 0)),
		outline(3, WHITE),
		move(data.dir, data.speed),
		pos(data.position),
		area({ collisionIgnore: [data.shooter, "platform", "bullet"] }),
		offscreen({ destroy: true }),
		"bullet",
		{ data: data },
	]);

	bullet.on("collide", (obj, col) => {
		bullet.destroy();
	});
}
