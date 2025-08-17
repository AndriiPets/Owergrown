import { GameObj } from "kaplay";

export function spin(speed: number = 1200) {
	let spinning = false;
	return {
		require: ["rotate"],
		update() {
			if (!spinning) {
				return;
			}
			this.angle -= speed * dt();
			if (this.angle <= -360) {
				spinning = false;
				this.angle = 0;
			}
		},
		spin() {
			spinning = true;
		},
	};
}

export function platformPatrol(speed: number = 3000) {
	return {
		id: "patrol",
		require: ["pos", "area", "sprite"],
		dir: 1,
		probe: null,

		add() {
			this.probe = this.add([
				rect(4, 4),
				area({ collisionIgnore: ["player", "enemy", "bullet", "probe"] }),
				anchor(vec2(4, -3)),
				opacity(0),
				"probe",
				{
					isOverGround: false,
				},
			]);

			this.probe.onCollideUpdate("ground", () => {
				this.probe.isOverGround = true;
			});

			this.probe.onCollideEnd("ground", () => {
				this.probe.isOverGround = false;
			});

			this.probe.on("collide", (obj, col) => {
				if (col.isLeft()) {
					this.dir = 1;
				} else if (col.isRight()) {
					this.dir = -1;
				}
			});
		},
		update() {
			//debug.log(this.dir, this.probe.isOverGround);
			if (!this.probe.isOverGround) {
				this.dir *= -1;
			}

			if (this.dir > 0) {
				this.probe.anchor = vec2(vec2(-8, -5));
				this.flipX = false;
			} else {
				this.probe.anchor = vec2(vec2(8, -5));
				this.flipX = true;
			}

			this.move(speed * this.dir * dt(), 0);
		},
	};
}

export function flickerable() {
	let isFlickering = false;

	return {
		id: "flickerable",
		require: ["opacity"],

		flicker(duration: number) {
			if (isFlickering) {
				return;
			}

			isFlickering = true;

			const flickerLoop = loop(0.05, () => {
				this.opacity = this.opacity === 1 ? 0 : 1;
			});

			wait(duration, () => {
				flickerLoop.cancel();
				this.opacity = 1;
				isFlickering = false;
			});
		},
	};
}

export function bounce() {
	let bouncing = false;
	let timer = 0;
	return {
		id: "bounce",
		require: ["scale"],
		update() {
			if (bouncing) {
				timer += dt() * 20;
				const w = Math.sin(timer) * 0.1;
				if (w < 0) {
					bouncing = false;
					timer = 0;
				} else {
					this.scale = vec2(1 + w);
				}
			}
		},
		bounce() {
			bouncing = true;
		},
	};
}
