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
