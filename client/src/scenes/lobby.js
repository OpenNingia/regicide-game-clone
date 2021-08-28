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

        this.dealText = this.add.text(75, 350, ['IN ATTESA DI GIOCATORI...']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff');
        
        let stdButtonConfig = {
            enabled: true,
            visible: true,
            color: '#00ffff',
            hoveringColor: '#ff69b4',
            disabledColor: '#eee',
            fontSize: 32,
            fontFamily: 'CompassPro'
        };        

        this.readyBtn = new Button(this, {...stdButtonConfig}).onClick(function() {
            self.amReady = !self.amReady;
            self.socket.emit('playerReady', self.amReady);
            
            if (self.amReady) {
                self.readyBtn.setText(['[X] SONO PRONTO'])
            } else {
                self.readyBtn.setText(['[] SONO PRONTO'])
            }
        });

        this.startBtn = new Button(this, {...stdButtonConfig}).setEnabled(false).onClick(function() {
            self.socket.emit('startGame');
        });       

        this.readyBtn.render(75, 650, ['[] SONO PRONTO']);
        this.startBtn.render(350, 650, ['[INIZIAMO!]']);        

        /** SOCKET CODE */        
        this.socket.off('playerJoin');
        this.socket.off('canStartGame');
        this.socket.off('startGame');

		this.socket.on('playerJoin', function (playerId, playerName, playerList) {

            self.players = playerList.map(x => new Player(x.playerId, x.playerName));
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

        this.socket.on('playerReady', function (playerId, isReady) {
            self.players.find(x=>x.playerId == playerId).playerReady = isReady;
            self.updatePlayerList();
        });

        this.socket.on('canStartGame', function (canStart) {
            self.startBtn.setEnabled(canStart);
        });

        this.socket.on('startGame', function (roomName) {
            console.log(`Room ${roomName} is ready, let's start`);
            // lobby completed, go to game
            self.scene.start('Game', { socket: self.socket, players: self.players, me: self.me });
        });

        this.socket.emit('playerJoin');
    }

    updatePlayerList() {
        let playerNames = this.players.map(x=>`> [${x.playerReady ? 'X' : ''}] ${x.playerName}`);
        this.dealText.setText(['IN ATTESA DI GIOCATORI...'].concat(playerNames));        
    }
}