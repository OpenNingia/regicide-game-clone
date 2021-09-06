import Player from '../helpers/player';
import io from 'socket.io-client';
import { setupBackground } from '../helpers/util';
import Button from '../helpers/button';

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

        this.waitText = this.add.text(75, 350, ['SELEZIONA UNA STANZA...']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff');
        
        let stdButtonConfig = {
            enabled: true,
            visible: true,
            color: '#00ffff',
            hoveringColor: '#ff69b4',
            disabledColor: '#eee',
            fontSize: 32,
            fontFamily: 'CompassPro'
        };        

        let readyBtn = new Button(this, {...stdButtonConfig}).onClick(function() {
            self.amReady = !self.amReady;
            self.socket.emit('playerReady', self.amReady);
            
            if (self.amReady) {
                readyBtn.setText(['[X] SONO PRONTO'])
            } else {
                readyBtn.setText(['[] SONO PRONTO'])
            }
        });

        let startBtn = new Button(this, {...stdButtonConfig}).setEnabled(false).onClick(function() {
            self.socket.emit('startGame');
        }).setEnabled(false);  

        let readyBtnObj = readyBtn.render(75, 650, ['[] SONO PRONTO']);
        let startBtnObj = startBtn.render(350, 650, ['[INIZIAMO!]']);


        // room list
        const windowBox = this.add.rectangle(1000, 360, 500, 400, 0xffffff, 0.4);
        const windowTitleBox = this.add.rectangle(1000, 185, 500, 50, 0xff000f, 0.4).setDepth(1);
        const title = this.add.text(790, 175, ['STANZE DISPONIBILI']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setDepth(2);
        const roomButtonList = []
        const roomButtonGroup = this.add.group();


        /** SOCKET CODE */        
        this.socket.on('roomInfo', function (roomList) {
            console.log('roomInfo', roomList);
            let i = 0;

            // create
            if (roomButtonList.length == 0) {
                roomList.forEach(r => {

                    let btn = new Button(self, {...stdButtonConfig}).setEnabled(false).onClick(function() {
                        console.log(`Joining room: ${r.name}`);
                        self.socket.emit('playerJoin', r.name); 
                    })
                    btn.data = r.name;
                    roomButtonList.push(btn);

                    let btnObj = btn.render(850, 250+(i++*50), `[${r.name} (${r.playerCount} giocatori)]`);

                    btn.setEnabled(r.isAvailable);
                    roomButtonGroup.add(btnObj, false);
            
                });   
            } else {
                // update
                roomButtonList.forEach(b => {
                    const room = roomList.find(x=>x.name===b.data);
                    if (room) {
                        b.setText(`[${room.name} (${room.playerCount} giocatori)]`)
                        b.setEnabled(room.isAvailable);
                    }
                });
            }

        });

		this.socket.on('playerJoin', function (playerId, playerName, playerList) {

            self.players = playerList.map(x => new Player(x.playerId, x.playerName, x.ready));
            console.log(`players: ${self.players}`);

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
            self.socket.off('playerReady');
            self.socket.off('canStartGame');
            self.socket.off('startGame');            

            self.waitText.destroy();

            readyBtnObj.destroy();
            startBtnObj.destroy();
        });        

        this.socket.emit('roomInfo');        
    }

    updatePlayerList() {
        let playerNames = this.players.map(x=>`> [${x.playerReady ? 'X' : ''}] ${x.playerName}`);
        this.waitText.setText(['IN ATTESA DI GIOCATORI...'].concat(playerNames));        
    }
}