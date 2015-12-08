RemotePlayer = function (index, game, player, startX, startY, facing) {
    var x = startX;
    var y = startY;

    this.game = game;
    this.player = player;
    this.alive = true;
    this.f = facing;
    this.lastF = null;

    this.player = game.add.sprite(x, y, 'dude');
    this.player.body.bounce.y = 0.2;
    this.player.body.minVelocity.y = 5;
    this.player.body.collideWorldBounds = true;
    this.player.body.setRectangle(16, 32, 8, 16);

    this.player.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player.animations.add('turn', [4], 20, true);
    this.player.animations.add('right', [5, 6, 7, 8], 10, true);

    this.player.name = index.toString();

    this.lastPosition = { x: x, y: y, f: this.f}

    this.update = function(){
        this.lastPosition.x = this.player.x;
        this.lastPosition.y = this.player.y;
        this.lastPosition.f = this.f;
    };
}

// RemotePlayer.prototype.update = function() {
//     this.lastPosition.x = this.player.x;
//     this.lastPosition.y = this.player.y;
// };


var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.tilemap('level1', 'assets/games/starstruck/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles-1', 'assets/games/starstruck/tiles-1.png');
    game.load.spritesheet('dude', 'assets/games/starstruck/dude.png', 32, 48);
    game.load.spritesheet('droid', 'assets/games/starstruck/droid.png', 32, 32);
    game.load.image('starSmall', 'assets/games/starstruck/star.png');
    game.load.image('starBig', 'assets/games/starstruck/star2.png');
    game.load.image('background', 'assets/games/starstruck/background2.png');
}

var socket;
var map;
var tileset;
var layer;
var player;
var enemies;
var facing = 'right';
var jumpTimer = 0;
var cursors;
var jumpButton;
var bg;

function create() {
    socket = io.connect("http://localhost", {port: 8000, transports: ["websocket"]});

    game.stage.backgroundColor = '#000000';

    bg = game.add.tileSprite(0, 0, 800, 600, 'background');
    bg.fixedToCamera = true;

    map = game.add.tilemap('level1');

    map.addTilesetImage('tiles-1');

    map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);

    layer = map.createLayer('Tile Layer 1');

    //  Un-comment this on to see the collision tiles
    // layer.debug = true;

    layer.resizeWorld();

    game.physics.gravity.y = 800;
    game.physics.setBoundsToWorld();

    player = game.add.sprite(32, 32, 'dude');
    player.body.bounce.y = 0.2;
    player.body.minVelocity.y = 5;
    player.body.collideWorldBounds = true;
    player.body.setRectangle(16, 32, 8, 16);

    //  Un-comment this on to see the body collision areas / data
    // player.debug = true;

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('turn', [4], 20, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    enemies = [];

    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    setEventHandlers();
}

var setEventHandlers = function() {
    // Socket connection successful
    socket.on("connect", onSocketConnected);

    // Socket disconnection
    socket.on("disconnect", onSocketDisconnect);

    // New player message received
    socket.on("new player", onNewPlayer);

    // Player move message received
    socket.on("move player", onMovePlayer);

    // Player removed message received
    socket.on("remove player", onRemovePlayer);
};

// Socket connected
function onSocketConnected() {
    console.log("Connected to socket server");

    // Send local player data to the game server
    socket.emit("new player", {x: player.x, y:player.y, f:facing});
};

// Socket disconnected
function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
    console.log("New player connected: "+data.id);

    // Add new player to the remote players array
    enemies.push(new RemotePlayer(data.id, game, player, 32, 32, facing));
};

// Move player
function onMovePlayer(data) {
    
    var movePlayer = playerById(data.id);

    // Player not found
    if (!movePlayer) {
        console.log("Player not found: "+data.id);
        return;
    };

    // Update player position
    movePlayer.player.x = data.x;
    movePlayer.player.y = data.y;
    movePlayer.f = data.f;
};

// Remove player
function onRemovePlayer(data) {

    var removePlayer = playerById(data.id);

    // Player not found
    if (!removePlayer) {
        console.log("Player not found: "+data.id);
        return;
    };

    removePlayer.player.kill();

    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1);

};

function update() {

    for (var i = 0; i < enemies.length; i++)
    {
        if (enemies[i].alive)
        {
            enemies[i].update();
            game.physics.collide(enemies[i].player, layer);

            // update facing
            if(enemies[i].f!='idle'){
                if(enemies[i].f=='left'){
                    enemies[i].player.animations.play('left');
                    enemies[i].lastF='left';
                }else{
                    enemies[i].player.animations.play('right');
                    enemies[i].lastF='right';
                }
            }else{
                enemies[i].player.animations.stop();
                if (enemies[i].lastF == 'left')
                {
                    enemies[i].player.frame = 0;
                }
                else
                {
                    enemies[i].player.frame = 5;
                }
            }
        }
    }

    game.physics.collide(player, layer);

    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        player.body.velocity.x = -150;

        if (facing != 'left')
        {
            player.animations.play('left');
            facing = 'left';
        }
    }
    else if (cursors.right.isDown)
    {
        player.body.velocity.x = 150;

        if (facing != 'right')
        {
            player.animations.play('right');
            facing = 'right';
        }
    }
    else
    {
        if (facing != 'idle')
        {
            player.animations.stop();

            if (facing == 'left')
            {
                player.frame = 0;
            }
            else
            {
                player.frame = 5;
            }

            facing = 'idle';
        }
    }
    
    if (jumpButton.isDown && player.body.onFloor() && game.time.now > jumpTimer)
    {
        player.body.velocity.y = -400;
        jumpTimer = game.time.now + 750;
    }

    socket.emit("move player", {x: player.x, y:player.y, f:facing});

}

function render () {

    if (player.debug)
    {
        game.debug.renderPhysicsBody(player.body);
        game.debug.renderBodyInfo(player, 16, 24);
    }

}

// Find player by ID
function playerById(id) {
    var i;
    for (i = 0; i < enemies.length; i++) {
        if (enemies[i].player.name == id)
            return enemies[i];
    };
    
    return false;
};