import { spawnBullet } from "../objects/bullet.ts";
import { spawnPlatform } from "../objects/platform.ts";
import { bulletData } from "../types.ts";
import { parseChunk, spawnManager } from "../utils.ts";
import { chunkCache } from "./loader.ts";
import {
	defaultStartMapPath,
	level1Chunks,
} from "../gameData/levels/level1_manifest.ts";
import * as tiled from "@kayahr/tiled";
import { GameObj } from "kaplay";

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

//--- TILED HELPER FUNCTION ---
function transformTiledProperties(
	properties: any[] | undefined
): TiledChunkProperties | null {
	if (!Array.isArray(properties)) {
		return null;
	}
	const props: Partial<TiledChunkProperties> = {};
	for (const prop of properties) {
		if (prop.name === "left_connector") props.left_connector = prop.value;
		if (prop.name === "right_connector") props.right_connector = prop.value;
		if (prop.name === "top_connector") props.top_connector = prop.value;
		if (prop.name === "bottom_connector") props.bottom_connector = prop.value;
	}
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
	// --- Add a debug log to confirm the reset ---
	setGravity(1600);

	//setLayers(["bg", "obj", "ui"], "obj");
	let lastGeneratedRowY = 0;
	let lastChunkRightConnector: ConnectorType = "ground";
	let lastRowTopConectors: ConnectorType[] = ["ground", "ground", "ground"];
	let hasGameStarted = false;
	let isGameOver = false;

	// --- DIFFICULTY VARIABLES ---
	const BASE_SPEED = 10;
	const SPEED_INCREASE_INTERVAL = 50; // Every 50 points of height
	const SPEED_INCREASE_FACTOR = 8; // Increase speed by 0.5
	let gameSpeed = 10;
	const verticalThreshold = height() / 3;

	const gameManager = add([
		"game", // The tag we will trigger events on
	]);

	const PARALLAX_FACTOR = 0.5; // Background scrolls at 50% of the camera speed
	const bgSpriteName = "background"; // Re-using a large existing sprite for the background
	const bgSpriteData = getSprite(bgSpriteName).data;

	// Scale the background to cover the screen, preserving aspect ratio by fitting the larger dimension
	const bgScale = Math.max(
		width() / bgSpriteData.width,
		height() / bgSpriteData.height
	);

	// Add two background objects for seamless vertical scrolling
	/*const bg1 = add([
		sprite(bgSpriteName),
		pos(width() / 2, height() / 2),
		anchor("center"),
		scale(bgScale),
		z(-100),
		layer("bg"), // Ensure background is on the 'bg' layer
		"background",
	]);*/

	//--- INITIAL MAP SETUP ---
	const startMapData = chunkCache.get(defaultStartMapPath);
	if (startMapData) {
		const startMap = parseChunk(startMapData, vec2(0, 0));
		startMap.use(sprite("default_map"));
		add(startMap);
	}

	// --- PLAYER CREATION ---
	const player = spawnManager.processSpawns();
	if (!player.pos) {
		debug.log("no player pos");
	}
	if (!player) {
		debug.error(
			"Player object could not be created by spawnManager. Check the 'player' entry in your default_map.json"
		);
		return;
	}

	// --- INPUT HANDLING ---
	on("start", "game", () => {
		if (!hasGameStarted) {
			hasGameStarted = true;
		}
	});

	onButtonPress("jump", () => {
		if (isGameOver) {
			go("reset");
		}
	});

	//--- UI SETUP ---
	let score = 0;
	const startY = player.pos.y;
	const scoreLabel = add([
		text(`Height: ${score}`),
		pos(12, 12),
		layer("ui"),
		fixed(),
		z(100),
	]);

	function showGameOverScreen() {
		add([
			text("Game Over"),
			pos(center()),
			anchor("center"),
			layer("ui"),
			fixed(),
			scale(2),
			z(100),
		]);
		add([
			text(`FINAL SCORE: ${score}`, { size: 16 }),
			pos(center().x, center().y + 40),
			anchor("center"),
			layer("ui"),
			fixed(),
			z(100),
		]);
		add([
			text("Press Jump to Restart", { size: 16 }),
			pos(center().x, center().y + 60),
			anchor("center"),
			layer("ui"),
			fixed(),
			z(100),
		]);
	}

	//--- MAIN GAME LOOP ---
	onUpdate(() => {
		if (isGameOver) return;

		if (player.pos.y > camPos().y + height() / 2) {
			isGameOver = true;
			shake(12);
			showGameOverScreen();
			return;
		}

		if (!hasGameStarted) return;

		// --- SCORE ---
		const heightClimbed = startY - player.pos.y;
		if (heightClimbed > 0) {
			const newScore = Math.floor(heightClimbed / 10);
			if (newScore > score) {
				score = newScore;
				scoreLabel.text = `Height: ${score}`;

				if (score > 0 && score % SPEED_INCREASE_INTERVAL === 0) {
					gameSpeed += SPEED_INCREASE_FACTOR;
				}
			}
		}

		// --- CAMERA ---
		if (player.screenPos().y < verticalThreshold) {
			const targetCamY = player.pos.y - verticalThreshold + height() / 2;
			camPos(width() / 2, lerp(camPos().y, targetCamY, 0.1));
		} else {
			camPos(camPos().x, camPos().y - gameSpeed * dt());
		}

		//--- GENERATION ---
		if (player.pos.y < lastGeneratedRowY + CHUNK_DIMENTIONS * 2.5) {
			fillChunksRow();
			spawnManager.processSpawns(); // This now only spawns non-player objects
		}
	});

	//--- CHUNK DATA PREPARATION ---
	const allChunks: levelChunk[] = level1Chunks
		.map((path) => {
			const mapData = chunkCache.get(path)!;
			const transformed = transformTiledProperties(mapData.properties as any[]);
			return { ...mapData, path, properties: transformed };
		})
		.filter((map): map is levelChunk => {
			if (!map.properties) {
				debug.error(`Chunk "${map.path}" is invalid.`);
				return false;
			}
			return true;
		});

	if (allChunks.length === 0) {
		debug.error("No valid level chunks were found!");
		return;
	}

	const leftCompat = new Map<ConnectorType, levelChunk[]>();
	for (const c of allChunks) {
		const l = c.properties.left_connector;
		if (!leftCompat.has(l)) leftCompat.set(l, []);
		leftCompat.get(l)!.push(c);
	}

	//--- LEVEL GENERATION LOGIC ---
	function fillChunksRow() {
		const chunksInRow = Math.floor(width() / CHUNK_DIMENTIONS);
		const newRowY = lastGeneratedRowY - CHUNK_DIMENTIONS;
		let bag = new Set(allChunks);
		const currentRowTopConnectors: ConnectorType[] = [];

		for (let i = 0; i < chunksInRow; i++) {
			const leftNeed = lastChunkRightConnector;
			const topNeed = lastRowTopConectors[i];
			let candidates = leftCompat.get(leftNeed) ?? [];
			candidates = candidates.filter((c) => {
				const untraversable =
					topNeed === "air_high" &&
					c.properties.bottom_connector === "ground" &&
					c.properties.top_connector !== "air_high";
				return !untraversable;
			});
			let preferred = candidates.filter((c) => bag.has(c));
			let chosen: levelChunk | undefined;
			if (preferred.length > 0) chosen = choose(preferred);
			else if (candidates.length > 0) chosen = choose(candidates);
			else {
				debug.log(`(Fallback) Total dead end. Picking random chunk.`);
				chosen = choose(allChunks);
			}
			if (!chosen) {
				debug.error("No chunk at all!");
				continue;
			}
			const newChunk = parseChunk(chosen, vec2(i * CHUNK_DIMENTIONS, newRowY));
			newChunk.use(
				offscreen({ destroy: true, distance: CHUNK_DIMENTIONS * 4 })
			);
			let pth = chosen.path.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
			newChunk.add([sprite(pth)]);
			add(newChunk);
			bag.delete(chosen);
			lastChunkRightConnector = chosen.properties.right_connector;
			currentRowTopConnectors.push(chosen.properties.top_connector);
		}
		lastGeneratedRowY = newRowY;
		lastRowTopConectors = currentRowTopConnectors;
	}

	//--- EVENT LISTENERS ---
	player.on("bloom", () => {
		spawnPlatform(vec2(player.pos.x, player.pos.y + 5));
	});
	on("fired", "player", (obj) => {
		const data: bulletData = {
			shooter: "player",
			speed: 600,
			position: obj.pos,
			damage: 1,
			dir: vec2(obj.flipX ? 1 : -1, 0),
		};
		spawnBullet(data);
	});
	on("fired", "turret", (obj) => {
		const direction = player.pos.sub(obj.pos).unit();
		const data: bulletData = {
			shooter: "turret",
			speed: 600,
			position: obj.pos,
			damage: 1,
			dir: direction,
		};
		spawnBullet(data);
	});

	// --- ADD MOVING VERTICAL WALLS ---
	// Left wall
	add([
		rect(10, height()),
		pos(0, 0),
		anchor("topleft"),
		area(),
		body({ isStatic: true }),
		fixed(), // This makes the wall stick to the camera
		opacity(0), // Invisible wall
		"wall",
	]);

	// Right wall
	add([
		rect(10, height()),
		pos(width(), 0),
		anchor("topright"),
		area(),
		body({ isStatic: true }),
		fixed(), // This makes the wall stick to the camera
		opacity(0), // Invisible wall
		"wall",
	]);
});
