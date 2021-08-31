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

        this.waitText = this.add.text(75, 350, ['IN ATTESA DI GIOCATORI...']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff');
        
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
        });       

        let readyBtnObj = readyBtn.render(75, 650, ['[] SONO PRONTO']);
        let startBtnObj = startBtn.render(350, 650, ['[INIZIAMO!]']);        

        /** SOCKET CODE */        
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

            self.socket.off('playerJoin');
            self.socket.off('playerReady');
            self.socket.off('canStartGame');
            self.socket.off('startGame');            

            self.waitText.destroy();

            readyBtnObj.destroy();
            startBtnObj.destroy();
        });        

        this.socket.emit('playerJoin');        
    }

    updatePlayerList() {
        let playerNames = this.players.map(x=>`> [${x.playerReady ? 'X' : ''}] ${x.playerName}`);
        this.waitText.setText(['IN ATTESA DI GIOCATORI...'].concat(playerNames));        
    }
}