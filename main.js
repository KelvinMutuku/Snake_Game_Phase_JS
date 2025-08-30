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