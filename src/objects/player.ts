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
    "palyer",
  ]);

  player.onKeyPress("space", () => {
    player.doubleJump();
  });

  player.onKeyDown("left", () => {
    player.move(-100, 0);
    player.flipX = false;
  });

  player.onKeyDown("right", () => {
    player.move(100, 0);
    player.flipX = true;
  });

  player.onDoubleJump(() => {
    player.spin();
    player.trigger("bloom");
  });

  return player;
}
