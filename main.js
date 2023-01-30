const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager("./assets/");
const ANIMANAGER = new AnimationManager();

ASSET_MANAGER.queueDownload("prototype_map.png", "link.png", "overworld_tiles.png", "enemies.png")

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;


	new AnimationBuilder(); // <- just to build the sprites & animations into ANIMANAGER


	gameEngine.addEntity(new Player(canvas.width/2 - 32, canvas.height/2 - 32)); 
	
	let roomWidth = 20;
	let roomHeight = 16;
	let testMap = new GameMap("prototype_map.png", roomWidth, roomHeight, 16*SCALE, 16*SCALE, {
		'#00ff00':'grass',
		'#555555':'stone_grass',
		'#333333':'stone_sand',
		'#ffff00':'sand'
	});

	let roomIndexX = 2;
	let roomIndexY = 2;
	testMap.loadMapCell(roomIndexX, roomIndexY);
	
	testMap.addMapEntitiesToEngine(gameEngine);
	gameEngine.currMap = testMap;

	gameEngine.init(ctx);

	gameEngine.start();
});