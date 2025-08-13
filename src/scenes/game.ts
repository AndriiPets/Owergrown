import { makePlayer } from "../objects/player.ts";

scene("game", () => {
  setGravity(1600);
  let scrollVel = 0;

  const player = makePlayer();

  add(player);

  //ground & walls
  add([
    rect(width(), 12),
    anchor("botleft"),
    pos(0, height()),
    color(GREEN),
    area(),
    body({ isStatic: true }),
    offscreen({ destroy: true }),
    "ground",
    "scrollable",
  ]);
  add([
    rect(5, height()),
    anchor("botleft"),
    pos(0, height()),
    area(),
    body({ isStatic: true }),
    opacity(0.0),
  ]);
  add([
    rect(5, height()),
    anchor("botright"),
    pos(width(), height()),
    area(),
    body({ isStatic: true }),
    opacity(0.0),
  ]);

  player.on("bloom", () => {
    add([
      rect(64, 10),
      anchor("center"),
      pos(player.pos.x, player.pos.y + 20),
      color(BLUE),
      area(),
      body({ isStatic: true }),
      offscreen({ destroy: true }),
      "platform",
      "scrollable",
    ]);
  });

  onUpdate(() => {
    const heigthTrigger = height() / 2;
    let targetVel = 0;

    // If the player is above the halfway point, set a target velocity.
    // The further the player is, the faster the target speed.
    if (player.pos.y < heigthTrigger) {
      // The '5' is a multiplier to control how fast the screen scrolls.
      // You can adjust this value to get the feel you want.
      targetVel = (heigthTrigger - player.pos.y) * 25;
    }

    // Smoothly interpolate the current scroll velocity towards the target.
    // The '10' is a smoothing factor. Higher values mean faster transition.
    scrollVel = lerp(scrollVel, targetVel, dt() * 15);
  });

  // This block moves all "scrollable" objects based on the smooth scroll velocity.
  onUpdate("scrollable", (s) => {
    // Move the object down by the calculated velocity.
    // dt() ensures the movement is consistent across different frame rates.
    s.move(0, scrollVel * dt());
  });
});
