import { GameObj, Vec2 } from "kaplay";
import { platformPatrol } from "../components.ts";
import { bulletData } from "../types.ts";
import { spin } from "../components.ts";
import { spawnBloodParticle } from "../objects/blood.ts";

export function makeEnemy(position: Vec2): GameObj {
	const enemy = make([
		sprite("tileset", { frame: 340 }),
		pos(position.x, position.y),
		anchor("center"),
		area({ collisionIgnore: [] }),
		body(),
		scale(1),
		health(3),
		platformPatrol(),
		rotate(0),
		spin(500),
		timer(),
		offscreen({ destroy: true }),
		"enemy",
		{
			numBlood: 0,
		},
	]);

	enemy.onAdd(() => {
		enemy.play("enemy_move");
		enemy.numBlood = enemy.hp() * 2;
	});

	enemy.onCollide("bullet", (obj, col) => {
		if (!obj.data) {
			debug.log("bullet has no data");
		}
		const bulletData = obj.data as bulletData;

		enemy.hurt(bulletData.damage);
		debug.log("enemy hit by a bullet health remaining: ", enemy.hp());
	});

	enemy.onHurt(() => {
		enemy.jump(150);
	});

	enemy.onDeath(() => {
		enemy.spin();

		for (let p: number = 0; p < enemy.numBlood; p++) {
			wait(p * 0.05, () => {
				spawnBloodParticle(enemy.pos);
			});
		}

		wait(enemy.numBlood * 0.05, () => {
			enemy.destroy();
		});
	});

	return enemy;
}
