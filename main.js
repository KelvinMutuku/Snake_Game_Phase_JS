// Size of one grid tile in pixels
const TILE = 16;

// Number of tiles across (columns) and down (rows)
// Game area = 40 * 16px wide (640px) and 30 * 16px tall (480px)
const COLS = 40;                 
const ROWS = 30;                 

// Total pixel width and height of the game canvas
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;

// Colors for background, snake head, snake body, and food
const COLORS = {
  bg: 0x1d1d1d,   // dark gray background
  head: 0x30c452, // bright green head
  body: 0x2aa04a, // darker green body
  food: 0xe94f37, // red food
};

// Directions represented as x and y offsets on the grid
// For example, moving left means x decreases by 1, y stays the same
const DIR = {
  left:  { x: -1, y:  0, name: 'left'  },
  right: { x:  1, y:  0, name: 'right' },
  up:    { x:  0, y: -1, name: 'up'    },
  down:  { x:  0, y:  1, name: 'down'  },
};

// Phaser game configuration
// - type: Phaser will use WebGL if possible, otherwise Canvas
// - parent: attach game canvas to <div id="game">
// - width/height: set canvas size
// - backgroundColor: dark background from COLORS
// - scene: defines which functions run during preload, create, and update
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: COLORS.bg,
  scene: { preload, create, update }
};

// Create a new Phaser game with the config
new Phaser.Game(config);
// Snake state
let snake;           // Array of grid cells [{x, y}, ...]; index 0 = head
let snakeRects;      // Array of Phaser rectangles drawn at snake cell positions
let direction;       // Current direction of snake movement (object from DIR)
let nextDirection;   // Next direction chosen by player input (applied on step)
let food;            // Current food cell {x, y}
let score = 0;       // Current score count
let scoreText;       // Phaser text object that displays the score
let moveEvent;       // Phaser timer event to move snake at fixed intervals
let speedMs = 130;   // Delay in milliseconds between moves (lower = faster)

// Input state
let cursors;         // Phaser helper object for arrow keys
let spaceKey;        // Phaser Key object for Space bar (restart the game)

/**
 * Convert a grid cell (x,y) to its pixel center (px,py) on the canvas.
 * Example: (0,0) -> (8,8) if TILE=16. Ensures rectangles are centered.
 */
function gridToPixelCenter(x, y) {
  return { px: x * TILE + TILE / 2, py: y * TILE + TILE / 2 };
}

/**
 * Pick a random grid cell that is not occupied by any cell in excludeCells.
 * - Creates a Set of occupied cells as "x,y" strings for fast lookup.
 * - Keeps generating random cells until it finds a free one.
 * Used to place food so it never spawns on the snake.
 */
function randomFreeCell(excludeCells) {
  const occupied = new Set(excludeCells.map(c => `${c.x},${c.y}`));
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!occupied.has(`${x},${y}`)) return { x, y };
  }
}

/**
 * Check if direction 'a' is exactly the opposite of direction 'b'.
 * Example: left vs right, or up vs down.
 * This prevents the snake from instantly turning 180° into itself.
 */
function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}
/**
 * preload()
 * Runs once before the game starts.
 * Used for loading images, sounds, and other assets.
 * In this version, we use simple colored rectangles (no assets needed).
 */
function preload() {
    // No assets to load in this version.
  }
  
  /**
   * create()
   * Runs once after preload. Sets up the game scene.
   * - Prepares keyboard input
   * - Calls initGame() to build the snake, food, score UI, and start movement
   */
  function create() {
    // Phaser helper that gives us arrow key input (up, down, left, right)
    cursors = this.input.keyboard.createCursorKeys();
  
    // Register the Space bar key to restart the game later
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  
    // Initialize the game state (snake, food, score, timer)
    // Using call(this) so that initGame runs in the context of the scene
    initGame.call(this);
  }
  /**
 * initGame()
 * Called when the game first starts or after pressing Space to restart.
 * - Clears old state (snake, food, timers)
 * - Resets score
 * - Creates a new snake in the center of the grid
 * - Spawns the first food
 * - Sets up score text
 * - Starts the timed loop that moves the snake
 */
function initGame() {
    // If an old movement timer exists, stop it (avoid multiple timers running)
    if (moveEvent) moveEvent.remove(false);
  
    // If old snake rectangles exist, destroy them to clean the screen
    if (snakeRects) snakeRects.forEach(r => r.destroy());
  
    // Reset the score and snake direction
    score = 0;
    direction = DIR.right;     // Snake starts moving to the right
    nextDirection = DIR.right; // Player input queue also points right
  
    // Find the starting position near the center of the grid
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
  
    // Snake starts with 3 segments, head + 2 body pieces
    snake = [
      { x: startX,     y: startY },     // head (middle)
      { x: startX - 1, y: startY },     // body segment left of head
      { x: startX - 2, y: startY },     // tail further left
    ];
  
    // Create rectangle objects in Phaser to visually draw the snake
    snakeRects = snake.map((cell, i) => {
      const { px, py } = gridToPixelCenter(cell.x, cell.y); // convert grid to pixel center
      const color = i === 0 ? COLORS.head : COLORS.body;    // head is a brighter green
      const rect = this.add.rectangle(px, py, TILE - 2, TILE - 2, color); // slightly smaller for spacing
      rect.setOrigin(0.5, 0.5);                             // center anchor point
      return rect;
    });
  
    // Spawn food at a random free cell (not overlapping snake)
    food = randomFreeCell(snake);
    const { px, py } = gridToPixelCenter(food.x, food.y);
  
    // If food already exists from a previous run, remove it first
    if (this.foodRect) this.foodRect.destroy();
  
    // Draw the new food as a red rectangle
    this.foodRect = this.add.rectangle(px, py, TILE - 2, TILE - 2, COLORS.food);
  
    // If score text does not exist yet, create it
    // Otherwise (on restart), just reset its value
    if (!scoreText) {
      scoreText = this.add.text(8, 6, 'Score: 0', { fontFamily: 'monospace', fontSize: 18, color: '#fff' });
      this.add.text(8, 28, 'Arrows to move. Space to restart.', { fontFamily: 'monospace', fontSize: 14, color: '#aaa' });
    } else {
      scoreText.setText('Score: 0');
    }
  
    // Reset speed and create a repeating timer
    // Every "speedMs" milliseconds, stepSnake() will run to move the snake
    speedMs = 130;
    moveEvent = this.time.addEvent({
      delay: speedMs,
      loop: true,
      callback: () => stepSnake.call(this) // .call(this) keeps Phaser scene context
    });
  
    // If a "Game Over" message exists from the last run, remove it
    if (this.gameOverText) {
      this.gameOverText.destroy();
      this.gameOverText = null;
    }
  }
  /**
 * update()
 * This runs every frame (Phaser’s game loop).
 * - Reads player input from arrow keys
 * - Updates "nextDirection" so the snake will turn on the next step
 * - Listens for Space bar press to restart the game if it’s over
 */
function update() {
    // Check if LEFT arrow is pressed AND it’s not the opposite of current direction
    if (cursors.left.isDown && !isOpposite(DIR.left, direction)) {
      nextDirection = DIR.left;
  
    // Check if RIGHT arrow is pressed
    } else if (cursors.right.isDown && !isOpposite(DIR.right, direction)) {
      nextDirection = DIR.right;
  
    // Check if UP arrow is pressed
    } else if (cursors.up.isDown && !isOpposite(DIR.up, direction)) {
      nextDirection = DIR.up;
  
    // Check if DOWN arrow is pressed
    } else if (cursors.down.isDown && !isOpposite(DIR.down, direction)) {
      nextDirection = DIR.down;
    }
  
    // If the game is over (a "Game Over" text exists)
    // AND the Space bar was just pressed → restart the game
    if (this.gameOverText && Phaser.Input.Keyboard.JustDown(spaceKey)) {
      initGame.call(this); // Reset everything (snake, food, score, timer)
    }
  }