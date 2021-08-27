import Player from '../helpers/player';
import io from 'socket.io-client';

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

        this.me = null;
        this.players = [];

        this.dealText = this.add.text(75, 350, ['IN ATTESA DI GIOCATORI...']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        /** SOCKET CODE */        
        this.socket.off('playerJoin');
        this.socket.off('roomFull');

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

            let playerNames = self.players.map(x=>`> ${x.playerName}`);
            self.dealText.setText(['IN ATTESA DI GIOCATORI...'].concat(playerNames));
        });

        this.socket.on('roomFull', function (roomName) {
            console.log(`Room ${roomName} is full, let's start`);
            // lobby completed, go to game
            self.scene.start('Game', { socket: self.socket, players: self.players, me: self.me });
        });

        this.socket.emit('playerJoin');
    }
}