import {
	defaultStartMapPath,
	level1Chunks,
} from "../gameData/levels/level1_manifest";
import * as tiled from "@kayahr/tiled";

export const chunkCache = new Map<string, tiled.Map>();

scene("loader", async () => {
	//loading message for loading all map data
	add([
		text("Loading chunks..."),
		anchor("center"),
		pos(width() / 2, height() / 2),
	]);

	const mapsToLoad = [defaultStartMapPath, ...level1Chunks];

	const loadPromises = mapsToLoad.map(async (path) => {
		try {
			const response = await fetch(`./maps/${path}`);
			if (!response.ok) {
				throw new Error(`Falied to fetch map data: ${path}`);
			}
			const data = (await response.json()) as tiled.Map;
			chunkCache.set(path, data);
		} catch (err) {
			debug.error(err);
		}
	});

	await Promise.all(loadPromises);

	go("game");
});
