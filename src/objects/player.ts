import { spin } from "../components.ts";

export function makePlayer() {
	const player = make([
		sprite("bean"),
		pos(100, 400),
		anchor("center"),
		area(),
		body({ jumpForce: 700 }),
		doubleJump(),
		rotate(0),
		spin(),
		scale(0.5),
		"palyer",
	]);

	player.onUpdate(() => {
		setCamPos(width() / 2, player.worldPos().y);
	});

	player.onPhysicsResolve(() => {
		setCamPos(width() / 2, player.worldPos().y);
	});

	player.onButtonPress("jump", () => {
		player.doubleJump();
	});

	player.onButtonDown("moveLeft", () => {
		player.move(-100, 0);
		player.flipX = false;
	});

	player.onButtonDown("moveRight", () => {
		player.move(100, 0);
		player.flipX = true;
	});

	player.onDoubleJump(() => {
		player.spin();
		player.trigger("bloom");
	});

	return player;
}
