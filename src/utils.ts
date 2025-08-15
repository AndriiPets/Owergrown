import { GameObj, Vec2 } from "kaplay";
import * as tiled from "@kayahr/tiled";

export function parseChunk(mapData: tiled.Map, position: Vec2): GameObj {
	const chunk = make([pos(position.x, position.y)]);

	for (const layer of mapData.layers) {
		if (layer.type === "tilelayer") continue;

		if (layer.type === "objectgroup" && layer.name === "colliders") {
			for (const object of layer.objects) {
				chunk.add([
					pos(object.x, object.y),
					rect(object.width, object.height),
					color(GREEN),
					area(),
					body({ isStatic: true }),
					offscreen({ destroy: true }),
					"mapChunk",
				]);
			}
			continue;
		}

		if (layer.type === "objectgroup" && layer.name === "positions") {
			for (const object of layer.objects) {
				if (object.name === "player") {
					chunk.trigger("spawn", { name: "player", x: object.x, y: object.y });
				}
			}
		}
	}

	return chunk;
}
