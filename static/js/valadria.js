valadria = function(gameData) {

var BAR_WIDTH = 150;
var BOUNDING_BUFFER = 3;
var BUFFER = 6;
var CHARACTER_WIDTH = 24;
var CHARACTER_HEIGHT = 24;
var CHARACTER_VELOCITY = 4;
var TILE_WIDTH = 24;
var TILE_HEIGHT = 24;
var UI_WIDTH = 30;
var UI_HEIGHT = 30;
var TILE_WALL = 1;
var Z_MODAL = 5;
var Z_OVERLAY = 4;
var Z_UI = 5;
var Z_MAP_CHARACTERS = 3;
var Z_MAP_ABOVE = 2;
var Z_MAP = 1;

var assets = {
  characters : 'img/characters_x3.png',
  environment : 'img/environment_x3.png',
  objects : 'img/objects_x3.png',
  ui : 'img/ui_x3.png'
};

var busy;
var currentCharacter;
var mapData;

var sheets = {
  characters : new DGE.Sprite.Sheet({
    image : assets.characters,
    spriteWidth : CHARACTER_WIDTH,
    spriteHeight : CHARACTER_HEIGHT,
    width : 384,
    height : 360
  }),
  environment : new DGE.Sprite.Sheet({
    image : assets.environment,
    spriteWidth : TILE_WIDTH,
    spriteHeight : TILE_HEIGHT,
    width : 384,
    height : 384
  }),
  /*
  objects : 'img/objects_x3.png',
  */
  ui : new DGE.Sprite.Sheet({
    image : assets.ui,
    spriteWidth : UI_WIDTH,
    spriteHeight : UI_HEIGHT,
    width : 210,
    height : 129
  })
};

var sprites = {};

var Card = DGE.Sprite.extend(function(conf) {

  if (conf === undefined) return;

  this.initSprite(conf);
  this.setCSS('background-position', '-3px -549px');

  this.nameText = new DGE.Text({
    parent : this,
    width : BAR_WIDTH,
    height : DGE.Text.defaults.size,
    x : BUFFER,
    y : BUFFER
  });

  this.levelText = new DGE.Text({
    align : 'right',
    parent : this,
    width : 73,
    height : DGE.Text.defaults.size,
    x : 160,
    y : BUFFER
  });

  this.imageSprite = new DGE.Sprite({
    parent : this,
    sheet : sheets.characters,
    width : CHARACTER_WIDTH,
    height : CHARACTER_HEIGHT,
    x : BUFFER,
    y : 39
  });

  // Heart (HP).
  new DGE.Sprite({
    parent : this,
    image : assets.objects,
    width : 15,
    height : 15,
    x : 63,
    y : 42
  }).setCSS('background-position', '-363px -174px');

  // HP Bar (background).
  new DGE.Sprite({
    background : '#3B7517',
    parent : this,
    width : BAR_WIDTH,
    height : 15,
    x : 84,
    y : 42
  });

  // HP Bar (foreground).
  this.hpSprite = new DGE.Sprite({
    background : '#61BF26',
    parent : this,
    width : 0,
    height : 15,
    x : 84,
    y : 42
  });

  /*
  // HP text.
  this.hpText = new DGE.Text({
    align : 'center',
    parent : this,
    text : '75/100',
    width : BAR_WIDTH,
    height : 15,
    x : 84,
    y : 44
  });
  */

  // MP Bar (background).
  new DGE.Sprite({
    background : '#242294',
    parent : this,
    width : BAR_WIDTH,
    height : 15,
    x : 84,
    y : 72
  });

  // MP Bar (foreground).
  this.mpSprite = new DGE.Sprite({
    background : '#3E3BFF',
    parent : this,
    width : 0,
    height : 15,
    x : 84,
    y : 72
  });

  // Wand (MP).
  new DGE.Sprite({
    image : assets.objects,
    parent : this,
    width : 15,
    height : 15,
    x : 63,
    y : 72
  }).setCSS('background-position', '-297px -72px');

}, {
  image : assets.ui,
  width : 240,
  height : 93
}, {
  'set:level' : function(level) {
  },
  'set:name' : function(name) {
    this.nameText.set('text', name);
  },
  'set:character' : function(character) {
    this.nameText.set('text', character.name);
    this.levelText.set('text', DGE.sprintf('LV: %s', character.level));
    this.hpSprite.set('width', ((character.hp / character.hp_max) * BAR_WIDTH));
    this.mpSprite.set('width', ((character.mp / character.mp_max) * BAR_WIDTH));
    this.imageSprite.set('sheetX', gameData.characterData[character.class_type].sprite[0]);
    this.imageSprite.set('sheetY', gameData.characterData[character.class_type].sprite[1]);
  }
});

var Character = DGE.Sprite.extend(function(conf) {

  if (conf === undefined) return;

  this.initSprite(conf);

  this.characterSprite = new DGE.Sprite({
  });

  this.hpSprite = new DGE.Sprite({
  });

}, {
});

function init() {

  DGE.Text.defaults.size = 14;

  initCharacterCreateScreen();
  initCharacterSelectScreen();
  initModal();
  initPlay();

  if (gameData.characters.length) {
    sprites.characterSelectScreen.show();
  } else {
    sprites.characterCreateScreen.show();
  }

};

function initCharacterCreateScreen() {

  sprites.characterCreateScreen = new DGE.Sprite({
    width : DGE.stage.width,
    height : DGE.stage.height
  });

  new DGE.Text({
    parent : sprites.characterCreateScreen,
    text : 'Pick a name and a class for your new character.',
    width : DGE.stage.width,
    x : BUFFER,
    y : BUFFER
  });

  new DGE.Text({
    parent : sprites.characterCreateScreen,
    text : 'Name:',
    width : DGE.stage.width,
    x : BUFFER,
    y : 50
  });

  var nameInput = new DGE.Text.Input({
    background : '#000',
    parent : sprites.characterCreateScreen,
    width : 200,
    x : 70,
    y : 45
  }).setCSS('border', '1px solid #FFF');

  var characterSprites = {};
  var classType;
  var disabled = 50;
  var selected;
  var x = BUFFER;

  var cursor = new DGE.Sprite({
    parent : sprites.characterCreateScreen,
    sheet : sheets.ui,
    sheetX : 1,
    sheetY : 2,
    width : UI_WIDTH,
    height : UI_HEIGHT,
    x : x
  });

  function select(selectedName) {

    classType = selectedName;

    for (var name in characterSprites) {
      characterSprites[name].sprite.set('opacity', disabled);
      characterSprites[name].text.set('opacity', disabled);
    }

    characterSprites[selectedName].sprite.set('opacity', 100);
    characterSprites[selectedName].text.set('opacity', 100);
    cursor.set('y', characterSprites[selectedName].sprite.y);

  };

  new DGE.Text({
    cursor : true,
    parent : sprites.characterCreateScreen,
    text : 'Create',
    width : 100,
    x : BUFFER,
    y : (DGE.stage.height - (BUFFER + DGE.Text.defaults.size))
  }).on('click', function() {

    if (busy) return;
    busy = true;

    // TODO: validate name right here

    createCharacter(
      classType,
      nameInput.node.value,
      {
        error : function(error) {

          busy = false;

          var message = new DGE.Text({
            parent : sprites.modal,
            text : DGE.sprintf('Sorry, there was an error. The server said:<br>%s', error),
            width : sprites.modal.width,
            height : (DGE.Text.defaults.height * 2),
            x : BUFFER,
            y : BUFFER
          });

          sprites.modal.show().on('click', function() {
            message.remove();
            sprites.modal.hide();
          });

        },
        success : function(characterID) {
          busy = false;
          sprites.characterSelectScreen.show()
        }
      }
    );

  });

  var cancel = new DGE.Text({
    cursor : true,
    parent : sprites.characterCreateScreen,
    text : 'Cancel',
    width : 100,
    x : 200,
    y : (DGE.stage.height - (BUFFER + DGE.Text.defaults.size))
  }).on('click', function() {
    sprites.characterSelectScreen.show()
  });

  sprites.characterCreateScreen.on('show', function() {

    sprites.characterSelectScreen.hide();

    var first;
    var y = 100;

    for (var name in characterSprites) {
      characterSprites[name].sprite.remove();
      characterSprites[name].text.remove();
    }

    characterSprites = {};

    for (var name in gameData.characterData) {

      var character = gameData.characterData[name];
      characterSprites[name] = {};
      first = (first || name);

      characterSprites[name].sprite = new DGE.Sprite({
        cursor : true,
        name : name,
        opacity : disabled,
        parent : sprites.characterCreateScreen,
        sheet : sheets.characters,
        sheetX : character.sprite[0],
        sheetY : character.sprite[1],
        width : CHARACTER_WIDTH,
        height : CHARACTER_HEIGHT,
        x : (x + UI_WIDTH + BUFFER),
        y : y
      }).on('click', function() {
        select(this.get('name'));
      });

      characterSprites[name].text = new DGE.Text({
        cursor : true,
        name : name,
        opacity : disabled,
        parent : sprites.characterCreateScreen,
        text : character.name,
        width : 200,
        x : ((x * 2) + CHARACTER_WIDTH + UI_WIDTH + BUFFER),
        y : (y + 5)
      }).on('click', function() {
        select(this.get('name'));
      });

      y += (BUFFER + CHARACTER_HEIGHT);

    }

    if (gameData.characters.length) {
      cancel.show();
    } else {
      cancel.hide();
    }

    select(first);

  });

};

function initCharacterSelectScreen() {

  sprites.characterSelectScreen = new DGE.Sprite({
    width : DGE.stage.width,
    height : DGE.stage.height
  });

  new DGE.Text({
    parent : sprites.characterSelectScreen,
    text : DGE.sprintf(
      'Welcome, %s. Which character would you like to play?',
      gameData.player.name
    ),
    width : DGE.stage.width,
    height : DGE.stage.height,
    x : BUFFER,
    y : BUFFER
  });

  new DGE.Text({
    cursor : true,
    parent : sprites.characterSelectScreen,
    text : 'Create a new character',
    width : 200,
    height: DGE.Text.defaults.size,
    x : BUFFER,
    y : (DGE.stage.height - (BUFFER + DGE.Text.defaults.size))
  }).on('click', function() {
    sprites.characterCreateScreen.show();
  });

  var cards = [];

  sprites.characterSelectScreen.on('show', function() {

    sprites.characterCreateScreen.hide();
    sprites.playScreen.hide();

    for (var i = 0; i < cards.length; i++) {
      cards[i].remove();
    }

    cards = []
    var x = 10;
    var y = (DGE.Text.defaults.size + (BUFFER * 2));

    for (var i = 0; i < gameData.characters.length; i++) {

      var character = gameData.characters[i];

      cards.push(new Card({
        cursor : true,
        index : i,
        parent : sprites.characterSelectScreen,
        sheet : sheets.characters,
        sheetX : gameData.characterData[character.class_type].sprite[0],
        sheetY : gameData.characterData[character.class_type].sprite[1],
        x : x,
        y : y
      }).on('click', function() {
        play(gameData.characters[this.get('index')])
      }).set('character', character));

      y += (Card.defaults.height + BUFFER);

    }

  });

};

function initPlay() {

  sprites.playScreen = new DGE.Sprite({
    width : DGE.stage.width,
    height : DGE.stage.height
  }).hide();

  sprites.map = new DGE.Sprite({
    parent : sprites.playScreen,
    z : Z_MAP
  });

  sprites.tiles = {};

sprites.debugCursor = new DGE.Sprite({
  parent : sprites.map,
  width : TILE_WIDTH,
  height : TILE_WIDTH,
  z : Z_UI
})
  .hide()
  .setCSS('border', '1px dashed #FFF');

  sprites.ui = {
    quit : new DGE.Sprite({
      cursor : true,
      parent : sprites.playScreen,
      sheet : sheets.ui,
      sheetX : 0,
      sheetY : 0,
      title : 'Quit game.',
      width : UI_WIDTH,
      height : UI_WIDTH,
      x : (DGE.stage.width - UI_WIDTH - BUFFER),
      y : (DGE.stage.height - UI_HEIGHT - BUFFER),
      z : Z_UI
    }).on('click', function() {
      sprites.characterSelectScreen.show();
    })
  };

};

function initModal() {

  sprites.overlay = new DGE.Sprite({
    background : '#000',
    opacity : 80,
    width : DGE.stage.width,
    height : DGE.stage.height,
    z : Z_OVERLAY
  }).hide();

  sprites.modal = new DGE.Sprite({
    background : '#666',
    width : DGE.stage.width / 2,
    height : DGE.stage.height / 2,
    z : Z_MODAL
  }).on('hide', function() {
    sprites.overlay.hide();
  }).on('show', function() {
    sprites.overlay.show();
    this.center();
  }).hide();

};

function canMoveToXY(x, y) {

  // Check upper-left corner first.
  var script = getMapScript((x + 1), (y + 1));
  if (script == TILE_WALL) return false;

  // Check lower-left corner.
  var script = getMapScript((x + 1), ((y + CHARACTER_HEIGHT) - 1));
  if (script == TILE_WALL) return false;

  // Check upper-right corner.
  var script = getMapScript(((x + CHARACTER_WIDTH) - 1), (y + 1));
  if (script == TILE_WALL) return false;

  // Check lower-right corner.
  var script = getMapScript(((x + CHARACTER_WIDTH) - 1), ((y + CHARACTER_HEIGHT) - 1));
  if (script == TILE_WALL) return false;

  return true;

};

function clearMap() {

  for (var depth in sprites.tiles) {
    if (depth != 'script') {
      for (var x = 0; x < sprites.tiles[depth].length; x++) {
        for (var y = 0; y < sprites.tiles[depth][x].length; y++) {
          if (sprites.tiles[depth][x][y]) sprites.tiles[depth][x][y].remove();
        }
      }
    }
  }

  sprites.tiles = {};

};

function createCharacter(classType, name, callbacks) {

  callbacks = (callbacks || {});

  DGE.xhr(
    'POST',
    '/api', {
      error : (callbacks.error || function() {}),
      success : function(result) {

        var json = DGE.json.decode(result);

        if (json.error) {
          if (callbacks.error) callbacks.error(json.message);
        } else if (callbacks.success) {
          gameData.characters.push(json.character);
          callbacks.success();
        }

      }
    }, {
      method : 'create_character',
      class_type : classType,
      name : name,
      player_id : gameData.player.id
    }
  );

};

function execAction(type, script) {

  DGE.log('action:', mapData.actions[script]);

  var action = mapData.actions[script];

  if (!action || !action[type]) return;

  switch (action[type].action) {
    case 'load_map':
      currentCharacter.map_name = action[type].map_name;
      currentCharacter.map_x = action[type].map_x;
      currentCharacter.map_y = action[type].map_y;
      sprites.character
        .stop()
        .set('x', (currentCharacter.map_x * TILE_WIDTH))
        .set('y', (currentCharacter.map_y * TILE_HEIGHT));
      loadMap({
        success : function() {
          sprites.character.start();
        }
      });
      break;
  };

};

function execScript(type, x, y) {

  // Check upper-left corner first.
  var script = getMapScript((x + 1), (y + 1));
  if (mapData.actions[script]) {
    execAction(type, script);
    return;
  }

  // Check lower-left corner.
  var script = getMapScript((x + 1), ((y + CHARACTER_HEIGHT) - 1));
  if (mapData.actions[script]) {
    execAction(mapData.actions[script]);
  }

  // Check upper-right corner.
  var script = getMapScript(((x + CHARACTER_WIDTH) - 1), (y + 1));
  if (mapData.actions[script]) {
    execAction(mapData.actions[script]);
  }

  // Check lower-right corner.
  var script = getMapScript(((x + CHARACTER_WIDTH) - 1), ((y + CHARACTER_HEIGHT) - 1));
  if (mapData.actions[script]) {
    execAction(mapData.actions[script]);
  }

};

function getMap(name, callbacks) {

  callbacks = (callbacks || {});

  DGE.xhr(
    'POST',
    '/api', {
      error : (callbacks.error || function() {}),
      success : function(result) {

        var json = DGE.json.decode(result);

        if (json.error) {
          if (callbacks.error) callbacks.error(json.message);
        } else if (callbacks.success) {
          callbacks.success(result);
        }

      }
    }, {
      method : 'get_map',
      name : name,
      player_id : gameData.player.id
    }
  );

};

function getMapScript(x, y) {

  var tileX = Math.floor(x / TILE_WIDTH);
  var tileY = Math.floor(y / TILE_HEIGHT);

  if (mapData.script[tileX] !== undefined) {
    if (mapData.script[tileX][tileY] !== undefined) {
      return mapData.script[tileX][tileY];
    }
  }

  return null;

};

/*
DGE.Keyboard.on('keyDown', function(keyCode) {
  DGE.log(keyCode);
});
function isInputActive(input) {

  var keys = DGE.Keyboard;

  switch (input) {
    case 'up':
      return (keys.isDown(keys.UP) || keys.isDown(keys.charToKeyCode('w')));
      break;
  }

};
*/

function loadMap(callbacks) {

  callbacks = (callbacks || {});

  var message = new DGE.Text({
    parent : sprites.modal,
    text : 'Loading ...',
    width : sprites.modal.width,
    height : sprites.modal.height,
    x : BUFFER,
    y : BUFFER
  });

  sprites.modal.show();

  getMap(currentCharacter.map_name, {
    error : function(error) {

      busy = false;
      message.set('text', DGE.sprintf('Sorry, there was an error. The server said:<br>%s', error));

      sprites.modal.show().on('click', function() {
        message.remove();
        sprites.modal.hide();
      });

    },
    success : function(result) {

      busy = false;
      var json = DGE.json.decode(result);
      mapData = json;

      clearMap();
      makeMap(mapData);

      message.remove();
      sprites.modal.hide();
      sprites.playScreen.show();
      if (callbacks.success) callbacks.success();

    }
  });

};

function makeMap(data) {

  for (var depth in data) {

    sprites.tiles[depth] = [];

    for (var x = 0; x < data[depth].length; x++) {
      sprites.tiles[depth][x] = [];
      if (data[depth][x] !== null) {
        for (var y = 0; y < data[depth][x].length; y++) {
          if (data[depth][x][y] !== null) {

            if (depth != 'script') {

              var coords = data[depth][x][y].split(',');

              sprites.tiles[depth][x][y] = new DGE.Sprite({
                parent : sprites.map,
                sheet : sheets.environment,
                sheetX : coords[0],
                sheetY : coords[1],
                x : (x * TILE_WIDTH),
                y : (y * TILE_WIDTH),
                width : TILE_WIDTH,
                height : TILE_WIDTH,
                z : ((depth == 'below') ? Z_MAP : Z_MAP_ABOVE)
              });
            }
            
          }
        }
        mapData.tilesY = y;
      }
    }
    mapData.tilesX = x;
  }

  sprites.map
    .set('width', (mapData.tilesX * TILE_WIDTH))
    .set('height', (mapData.tilesX * TILE_HEIGHT))

};

function makeSpriteFromCharacter(character) {

  var conf = {
    parent : sprites.map,
    sheet : sheets.characters,
    sheetX : gameData.characterData[character.class_type].sprite[0],
    sheetY : gameData.characterData[character.class_type].sprite[1],
    width : CHARACTER_WIDTH,
    height : CHARACTER_HEIGHT,
    x : (character.map_x * TILE_WIDTH),
    y : (character.map_y * TILE_HEIGHT),
    z : Z_MAP_CHARACTERS
  };
  var characterSprite = new DGE.Sprite(conf);
  characterSprite.characterData = character;

  return characterSprite;

};

function play(character) {

  busy = true;

  sprites.characterSelectScreen.hide();

  currentCharacter = character;
  if (sprites.character) sprites.character.remove();
  sprites.character = makeSpriteFromCharacter(currentCharacter);

  sprites.character.on('ping', function() {

    var keyboard = DGE.Keyboard;

    if (keyboard.isDown(keyboard.UP)) {
    //if (isInputActive('up'))
      if (canMoveToXY(this.x, (this.y - CHARACTER_VELOCITY))) {
        this.offset('y', -CHARACTER_VELOCITY);
        execScript('walk', this.x, (this.y - CHARACTER_VELOCITY));
      }
    } else if (keyboard.isDown(keyboard.DOWN)) {
      if (canMoveToXY(this.x, (this.y + CHARACTER_VELOCITY))) {
        this.offset('y', CHARACTER_VELOCITY);
      }
    }

    if (keyboard.isDown(keyboard.LEFT)) {
      if (canMoveToXY((this.x - CHARACTER_VELOCITY), this.y)) {
        this.offset('x', -CHARACTER_VELOCITY);
      }
    } else if (keyboard.isDown(keyboard.RIGHT)) {
      if (canMoveToXY((this.x + CHARACTER_VELOCITY), this.y)) {
        this.offset('x', CHARACTER_VELOCITY);
      }
    }

    return;

    /*
    var angle;
    var keyboard = DGE.Keyboard;

    if (keyboard.isDown(keyboard.UP)) {
      if (keyboard.isDown(keyboard.LEFT)) {
        angle = 45;
      } else if (keyboard.isDown(keyboard.RIGHT)) {
        angle = 135;
      } else {
        angle = 90;
      }
    } else if (keyboard.isDown(keyboard.DOWN)) {
      if (keyboard.isDown(keyboard.LEFT)) {
        angle = 315;
      } else if (keyboard.isDown(keyboard.RIGHT)) {
        angle = 225;
      } else {
        angle = 270;
      }
    } else if (keyboard.isDown(keyboard.LEFT)) {
      angle = 0;
    } else if (keyboard.isDown(keyboard.RIGHT)) {
      angle = 180;
    } else {
      this.set('velocity', 0);
    }

    if (angle !== undefined) {

      var coords = DGE.getCoordsByAngleVelocity(
        angle,
        CHARACTER_VELOCITY
      );

      if (canMoveToXY((this.x + coords.x), (this.y + coords.y))) {
        this.set('angle', angle);
        this.set('velocity', CHARACTER_VELOCITY);
      } else {
        this.set('velocity', 0);
      }

    }
    */

  });

  loadMap({
    success : function() {
      sprites.character.start();
    }
  });

};

DGE.init({
  id : 'valadria',
  background : '#000',
  width : 640,
  height : 480
});

new DGE.Loader([assets], {
  complete : init
});

};
