import { makePlayer } from "../objects/player.ts";
import { parseChunk } from "../utils.ts";
import { chunkCache } from "./loader.ts";
import {
	defaultStartMapPath,
	level1Chunks,
} from "../gameData/levels/level1_manifest.ts";
import * as tiled from "@kayahr/tiled";

const CHUNK_DIMENTIONS = 160;

//--- MAP CHUNKS TYPES DEFINITION ---
type ConnectorType =
	| "ground"
	| "air_mid"
	| "air_high"
	| "wall_right"
	| "wall_left"
	| "open"
	| null;

interface TiledChunkProperties {
	left_connector: ConnectorType;
	right_connector: ConnectorType;
	top_connector: ConnectorType;
	bottom_connector: ConnectorType;
}
type levelChunk = tiled.Map & {
	properties: TiledChunkProperties;
	path: string;
};
//type guard
function isLevelChunk(map: tiled.Map & { path: string }): map is levelChunk {
	// Check that the properties object exists
	if (!map.properties) {
		return false;
	}
	// Check that both required connector keys are present in the properties object
	return (
		"left_connector" in map.properties && "right_connector" in map.properties
	);
}

//--- TILED HELPER FUNCTION ---
/**
 * Transforms the Tiled properties array into a simple key-value object.
 * @param properties The 'properties' array from a raw Tiled map object.
 * @returns A TiledChunkProperties object, or null if parsing fails.
 */
function transformTiledProperties(
	properties: any[] | undefined
): TiledChunkProperties | null {
	if (!Array.isArray(properties)) {
		return null;
	}

	const props: Partial<TiledChunkProperties> = {};

	for (const prop of properties) {
		if (prop.name === "left_connector") {
			props.left_connector = prop.value;
		}
		if (prop.name === "right_connector") {
			props.right_connector = prop.value;
		}
		if (prop.name === "top_connector") {
			props.top_connector = prop.value;
		}
		if (prop.name === "bottom_connector") {
			props.bottom_connector = prop.value;
		}
	}

	// Ensure both required properties were found before returning the object
	if (
		props.left_connector !== undefined &&
		props.right_connector !== undefined &&
		props.top_connector !== undefined &&
		props.bottom_connector !== undefined
	) {
		return props as TiledChunkProperties;
	}

	return null;
}

//--- GAME SCENE CODE ---

scene("game", async () => {
	setGravity(1600);
	let lastGeneratedRowY = 0;
	let lastChunkRightConnector: ConnectorType = "ground";
	let lastRowTopConectors: ConnectorType[] = ["ground", "ground", "ground"];

	//--- INITIAL MAP SETUP ---
	const startMapData = chunkCache.get(defaultStartMapPath);
	if (startMapData) {
		const startMap = parseChunk(startMapData, vec2(0, 0));
		add(startMap);
	}

	const player = makePlayer();
	add(player);

	//--- TODO: implement full spawner
	on("spawn", "mapChunk", (data) => {
		if (data.name === "player") {
			(player.pos.x = data.x), (player.pos.y = data.y);
		}
	});

	//--- PREPARE CHUNK DATA ---
	const allChunks: levelChunk[] = level1Chunks
		.map((path) => {
			const mapData = chunkCache.get(path)!;
			const transformed = transformTiledProperties(mapData.properties as any[]);
			return { ...mapData, path, properties: transformed };
		})
		.filter((map): map is levelChunk => {
			if (!map.properties) {
				debug.error(
					`The chunk "${map.path}" is invalid. It is missing 'left_connector','right_connector','top_connector' or 'bottom_connector' properties in Tiled.`
				);
				return false;
			}
			return true;
		});

	if (allChunks.length === 0) {
		debug.error("No valid level chunks were found! Check Tiled properties.");
		return;
	}

	//--- LEVEL GENERATION LOGIC ---
	function fillChunksRow() {
		const chunksInRow = Math.floor(width() / CHUNK_DIMENTIONS);
		const newRowY = lastGeneratedRowY - CHUNK_DIMENTIONS;
		const chunkBag = [...allChunks];

		const currentRowTopConnectors: ConnectorType[] = [];

		for (var i: number = 0; i < chunksInRow; i++) {
			let chosenChunkData: levelChunk | undefined;

			const lastTop = lastRowTopConectors[i];

			let compatibleChunks = chunkBag.filter((chunk) => {
				//Initial filter checks vertical and horizontal rules in the bag
				const isHorizontallyCompatible =
					chunk.properties.left_connector === lastChunkRightConnector;
				if (!isHorizontallyCompatible) return false;

				const currBotom = chunk.properties.bottom_connector;
				const createsGap =
					lastTop === "air_high" &&
					currBotom === "ground" &&
					chunk.properties.top_connector !== "air_high";
				return !createsGap;
			});

			if (compatibleChunks.length === 0) {
				debug.log(
					`No compatible chunk found in the bag for connector:
					  '${lastChunkRightConnector}' & top: '${lastTop}' Searching full library...`
				);
				compatibleChunks = allChunks.filter((chunk) => {
					//Fallback filter checks for rules outside the bag
					const isHorizontallyCompatible =
						chunk.properties.left_connector === lastChunkRightConnector;
					if (!isHorizontallyCompatible) return false;

					const currBotom = chunk.properties.bottom_connector;
					const createsGap =
						lastTop === "air_high" &&
						currBotom === "ground" &&
						chunk.properties.top_connector !== "air_high";
					return !createsGap;
				});

				if (compatibleChunks.length === 0) {
					//Fallback no2 ignoring vertical rules
					debug.log(`Still no vertically compatible chunk. 
					Ignoring vertical rules for this chunk.`);
					compatibleChunks = allChunks.filter(
						(c) => c.properties.left_connector === lastChunkRightConnector
					);
				}

				if (compatibleChunks.length === 0) {
					//Final fallback nothing
					debug.log("Still no chunk, Picking randomly");
					compatibleChunks = allChunks;
				}
			}

			chosenChunkData = choose(compatibleChunks);

			if (chosenChunkData) {
				const newChunk = parseChunk(
					chosenChunkData,
					vec2(i * CHUNK_DIMENTIONS, newRowY)
				);
				add(newChunk);

				lastChunkRightConnector = chosenChunkData.properties.right_connector;
				currentRowTopConnectors.push(chosenChunkData.properties.top_connector);

				//pop last chunk from the bag
				const indexInBag = chunkBag.findIndex(
					(c) => c.path === chosenChunkData!.path
				);
				if (indexInBag !== -1) {
					chunkBag.splice(indexInBag, 1);
				}
			} else {
				currentRowTopConnectors.push("open");
			}
		}
		lastGeneratedRowY = newRowY;
		lastRowTopConectors = currentRowTopConnectors;
	}

	onUpdate(() => {
		//--- DYNAMIC GENERATION TRIGGER ---
		if (player.pos.y < lastGeneratedRowY + CHUNK_DIMENTIONS * 1.5) {
			debug.log("heigth reached generate row", lastGeneratedRowY);
			fillChunksRow();
		}
	});

	//ground & walls

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
});
