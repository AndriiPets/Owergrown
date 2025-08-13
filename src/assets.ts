loadRoot("./"); // A good idea for Itch.io publishing later
loadSprite("bean", "sprites/player.png").onError((err) => {
  debug.log(err);
});
