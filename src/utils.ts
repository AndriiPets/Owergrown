import { GameObj, Vec2 } from "kaplay";
import { spawnPlayer } from "./objects/player.ts";
import { makeEnemy } from "./objects/enemy.ts";
import { makeFlamebar } from "./objects/flamebar.ts";
import { makeTurret } from "./objects/turret.ts";
import * as tiled from "@kayahr/tiled";

export const spawnManager = {
	pendingSpawns: [] as Array<{ name: string; x: number; y: number }>,

	addSpawn(name: string, x: number, y: number) {
		this.pendingSpawns.push({ name, x, y });
	},

	processSpawns() {
		let player: GameObj | null = null;
		this.pendingSpawns.forEach((data) => {
			if (data.name === "player") {
				player = spawnPlayer(vec2(data.x, data.y));
				//debug.log("player spawning...", data.name, data.x, data.y);
			}

			//--- OBSTACLEs ---

			if (data.name === "enemy") {
				if (chance(0.8)) {
					add(makeEnemy(vec2(data.x, data.y)));
					//debug.log("enemy spawning...", data.name, data.x, data.y);
				}
			}

			if (data.name === "flame") {
				if (chance(0.4)) {
					add(makeFlamebar(vec2(data.x, data.y)));
				}
				//debug.log("flame spawning...", data.name, data.x, data.y);
			}

			if (data.name === "turret") {
				if (chance(0.2)) {
					add(makeTurret(vec2(data.x, data.y)));
				}
				//debug.log("turret spawning...", data.name, data.x, data.y);
			}

			if (data.name === "crate") {
				add([
					sprite("tileset", { frame: 10 }),
					pos(vec2(data.x, data.y)),
					area(),
					anchor("center"),
					body({ mass: 6 }),
				]);
				//debug.log("crate spawning...", data.name, data.x, data.y);
			}
		});
		this.pendingSpawns = [];
		return player;
	},

	reset() {
		this.pendingSpawns = [];
	},
};

export function parseChunk(mapData: tiled.Map, position: Vec2): GameObj {
	const chunk = make([pos(position.x, position.y), "mapChunk"]);

	for (const layer of mapData.layers) {
		if (layer.type === "tilelayer") continue;

		if (layer.type === "objectgroup" && layer.name === "colliders") {
			for (const object of layer.objects) {
				chunk.add([
					pos(object.x, object.y),
					rect(object.width, object.height),
					opacity(0),
					area(),
					body({ isStatic: true }),

					"ground",
				]);
			}
			continue;
		}

		if (layer.type === "objectgroup" && layer.name === "positions") {
			for (const object of layer.objects) {
				if (!object.name) {
					debug.log(`unknown object: ${object.id}`);
					continue;
				}
				const worldX = position.x + object.x;
				const worldY = position.y + object.y;

				spawnManager.addSpawn(object.name, worldX, worldY);
			}
		}
	}

	return chunk;
}
