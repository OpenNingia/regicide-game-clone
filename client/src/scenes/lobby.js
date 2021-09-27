import PlayerModel from '../models/playerModel'
import { setupBackground } from '../helpers/util';
import Button from '../helpers/button';
import Frame from '../helpers/frame';

export default class Lobby extends Phaser.Scene {
    constructor() {
        super({
            key: 'Lobby'
        });
    }


    init(data) {
        console.log(`init lobby scene. ${data}`);
        this.socket = data.socket;        
    }

    preload() {
    }

    create() {
        let self = this;

        setupBackground(this);

        this.me = null;
        this.players = [];
        this.amReady = false;
        this.selectedRoom = '';

        this.waitText = this.add.text(500, 75, ['SELEZIONA UNA STANZA...'])
            .setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setOrigin(0);
        
        let stdButtonConfig = {
            enabled: true,
            visible: true,
            color: '#492811',
            hoveringColor: '#FFAE00',
            disabledColor: '#888',
            fontSize: 32,
            fontFamily: 'CompassPro',
            texture: 'button-full',
            textureScale: 0.5
        };        
        
        this.roomButtonGroup = this.add.group();

        let readyBtn = new Button(this, {...stdButtonConfig}, 20, 620, ['[] SONO PRONTO']).onClick(function() {
            self.amReady = !self.amReady;
            self.socket.emit('playerReady', self.amReady);
            
            if (self.amReady) {
                readyBtn.setText(['[X] SONO PRONTO'])
            } else {
                readyBtn.setText(['[] SONO PRONTO'])
            }

        }).setEnabled(false);

        let startBtn = new Button(this, {...stdButtonConfig}, 435, 620, ['INIZIAMO!']).setEnabled(false).onClick(function() {
            self.socket.emit('startGame');
        }).setEnabled(false);

        let fullScreenBtn = new Button(this, {...stdButtonConfig}, 850, 620, ['[] SCHERMO INTERO']).setEnabled(true).onClick(function() {
            const canvas = self.sys.game.canvas;
            const isFullScreen = document.fullscreenElement === canvas;
            if (isFullScreen) {                
                document[self.sys.game.device.fullscreen.cancel]();
                fullScreenBtn.setText(['[] SCHERMO INTERO'])
            } else {
                canvas[self.sys.game.device.fullscreen.request]();
                fullScreenBtn.setText(['[X] SCHERMO INTERO'])
            }
        }).setEnabled(true);          

        // room list
        let roomFrame = new Frame(this, 20, 10, 600, 605, ['Stanze disponibili']);

        this.controls = this.add.group([readyBtn, startBtn, fullScreenBtn]);
        this.controls.runChildUpdate = true;
        this.roomButtonGroup.runChildUpdate = true;

        let playerName = prompt('Inserisci il tuo nome');

        /** SOCKET CODE */        
        this.socket.on('roomInfo', function (roomList) {
            console.log('roomInfo', roomList);
            let i = 0;

            // create
            if (self.roomButtonGroup.getLength() == 0) {
                roomList.forEach(r => {

                    let margin = 5;
                    let btnSize = 80;
                    let btn = new Button(self, {...stdButtonConfig}, 110, 85+(i++*btnSize+margin), `${r.name} (${r.playerCount} giocatori)`).setEnabled(false).onClick(function() {
                        console.log(`Joining room: ${r.name}`);
                        self.socket.emit('playerJoin', playerName, r.name); 

                        readyBtn.setEnabled(true);

                        self.selectedRoom = r.name;
                    })
                    btn.name = r.name;
                    btn.setEnabled(r.isAvailable);
                    self.roomButtonGroup.add(btn, false);
            
                });   
            } else {
                // update
                self.roomButtonGroup.getChildren().forEach(b => {
                    const room = roomList.find(x=>x.name===b.name);
                    if (room) {
                        b.setText(`${room.name} (${room.playerCount} giocatori)`)
                        b.setEnabled(room.isAvailable);
                    }
                });
            }

        });

		this.socket.on('playerJoin', function (playerId, playerName, playerList) {

            self.players = playerList.map(x => new PlayerModel(x.playerId, x.playerName, x.ready));
            self.players.forEach(x=>console.log(x));

            if (self.me === null) {
                // this is me!
                self.me = self.players.find(x => x.playerId == playerId);
                console.log(`I joined the server! My Id is: ${playerId} and my name is: ${playerName}`);
            } else {
                console.log(`Joined player: ${playerId} as ${playerName}`);
            }

            self.updatePlayerList();
        });

        this.socket.on('playerLeave', function(playerId) {
            console.log(`Player left: ${playerId}`);
            self.players = self.players.filter(x=>x.playerId!==playerId);
            self.updatePlayerList();
        });

        this.socket.on('playerReady', function (playerId, isReady) {
            self.players.find(x=>x.playerId == playerId).playerReady = isReady;
            self.updatePlayerList();
        });

        this.socket.on('canStartGame', function (canStart) {
            startBtn.setEnabled(canStart);
        });

        this.socket.on('startGame', function (roomName) {
            console.log(`Room ${roomName} is ready, let's start`);
            // lobby completed, go to game
            self.scene.start('Game', { socket: self.socket, players: self.players, me: self.me });
        });

        this.events.on('shutdown', function() {
            console.log("(LOBBY SCENE) SHUTDOWN");

            self.socket.off('roomInfo');
            self.socket.off('playerJoin');
            self.socket.off('playerLeave');
            self.socket.off('playerReady');
            self.socket.off('canStartGame');
            self.socket.off('startGame');            

            self.waitText.destroy();
            self.controls.destroy();
            self.roomButtonGroup.destroy();
        });        

        // DEBUG: grid
        // this.grid = this.add.grid(0, 0, this.sys.game.config.width, this.sys.game.config.height, 50, 50, null, null, 0, 0.2).setOrigin(0);


        this.socket.emit('roomInfo');        
    }

    update() {
        // enable all buttons but this
        const room = this.selectedRoom;
        const self = this;
        this.roomButtonGroup.getChildren().forEach(b=>{
            if (self.amReady) {
                b.setEnabled(false);
            } else {
                // if we're ready we should disable room selection
                b.setEnabled(b.name !== room);
            }
        })
    }

    updatePlayerList() {
        let playerNames = this.players.map(x=>`> [${x.playerReady ? 'X' : ''}] ${x.playerName}`);
        this.waitText.setText(['IN ATTESA DI GIOCATORI...'].concat(playerNames));        
    }
}