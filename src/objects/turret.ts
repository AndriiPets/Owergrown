import { GameObj, Vec2 } from "kaplay";
import { spin, bounce } from "../components.ts";
import { spawnBloodParticle } from "../objects/blood.ts";
import { bulletData } from "../types.ts";

export function makeTurret(position: Vec2): GameObj {
	const turret = make([
		sprite("tileset", { frame: 380 }),
		anchor("center"),
		pos(position),
		area(),
		timer(),
		health(3),
		scale(1),
		bounce(),
		rotate(0),
		spin(),
		offscreen({ destroy: true }),
		"turret",
		{
			fireCooldown: 2.0,
			canFire: true,
			numBlood: 0,
		},
	]);

	turret.onAdd(() => {
		turret.play("turret_idle");
		turret.numBlood = turret.hp() * 2;
	});

	turret.onCollide("bullet", (obj, col) => {
		if (!obj.data) {
			debug.log("bullet has no data");
		}
		const bulletData = obj.data as bulletData;

		turret.hurt(bulletData.damage);
		debug.log("enemy hit by a bullet health remaining: ", turret.hp());
	});

	turret.onHurt(() => {
		turret.bounce();
	});

	turret.onUpdate(() => {
		if (turret.canFire) {
			turret.trigger("fired");
			turret.bounce();
			turret.canFire = false;

			turret.wait(turret.fireCooldown, () => {
				turret.canFire = true;
			});
		}
	});

	turret.onDeath(() => {
		turret.spin();

		for (let p: number = 0; p < turret.numBlood; p++) {
			wait(p * 0.05, () => {
				spawnBloodParticle(turret.pos);
			});
		}

		wait(turret.numBlood * 0.05, () => {
			turret.destroy();
		});
	});

	return turret;
}
