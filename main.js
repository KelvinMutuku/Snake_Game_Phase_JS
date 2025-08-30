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