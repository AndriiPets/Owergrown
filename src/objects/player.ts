import { GameObj, Vec2 } from "kaplay";
import { spin, flickerable, bounce } from "../components.ts";

export function spawnPlayer(position: Vec2): GameObj {
	const player = add([
		sprite("tileset", { frame: 301 }),
		pos(position.x, position.y),
		anchor("center"),
		area(),
		body({ jumpForce: 700 }),
		health(5),
		doubleJump(),
		rotate(0),
		spin(),
		scale(1),
		bounce(),
		opacity(1),
		timer(),
		flickerable(),
		"player",
		{
			canHurt: true,
			hitCooldown: 2.0,
			hasJumpedOnce: false,
		},
	]);

	player.onButtonPress("jump", () => {
		if (!player.hasJumpedOnce) {
			player.hasJumpedOnce = true;
			// The 'game:start' event will be heard by the game scene.
			trigger("start", "game");
		}
		player.play("player_jump");
		player.doubleJump();
	});

	player.onButtonDown("moveLeft", () => {
		player.move(-100, 0);
		if (player.isGrounded()) {
			player.play("player_move");
		}
		player.flipX = true;
	});

	player.onButtonRelease(["moveLeft", "moveRight"], () => {
		if (
			!isButtonDown("moveLeft") &&
			!isButtonDown("moveRight") &&
			player.isGrounded()
		) {
			player.play("player_idle"); // Set to idle sprite
		}
	});

	player.onGround(() => {
		// If no movement keys are pressed, switch to idle frame
		if (!isButtonDown("moveLeft") && !isButtonDown("moveRight")) {
			player.play("player_idle"); // Set to idle sprite
		} else {
			// If movement keys are pressed, play the move animation
			player.play("player_move");
		}
	});

	player.onButtonDown("moveRight", () => {
		player.move(100, 0);
		if (player.isGrounded()) {
			player.play("player_move");
		}
		player.flipX = false;
	});

	player.onDoubleJump(() => {
		player.spin();
		player.trigger("bloom");
	});

	player.onButtonPress("shoot", () => {
		player.trigger("fired");
		player.bounce();
	});

	player.onCollide("enemy", (obj, col) => {
		if (player.canHurt) {
			player.hurt(1);
			player.jump(400);
			player.canHurt = false;
			player.flicker(player.hitCooldown);
			player.wait(player.hitCooldown, () => {
				player.canHurt = true;
			});
			debug.log("player hit remaining: ", player.hp());
		}
	});

	player.onCollide("flame", (obj, col) => {
		if (player.canHurt) {
			player.hurt(1);
			player.jump(400);
			player.canHurt = false;
			player.flicker(player.hitCooldown);
			player.wait(player.hitCooldown, () => {
				player.canHurt = true;
			});
			debug.log("player hit remaining: ", player.hp());
		}
	});

	player.onCollide("bullet", (obj, col) => {
		if (player.canHurt) {
			player.hurt(1);
			player.jump(400);
			player.canHurt = false;
			player.flicker(player.hitCooldown);
			player.wait(player.hitCooldown, () => {
				player.canHurt = true;
			});
			debug.log("player hit remaining: ", player.hp());
		}
	});

	player.onHurt(() => {
		shake(3);
	});

	return player;
}
