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
        this.playerSlots = [];

        this.dealText = this.add.text(75, 350, ['IN ATTESA DI GIOCATORI...']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();

        /** SOCKET CODE */
        this.socket.emit('playerJoin');

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

            let otherPlayers = self.players.filter(x=>x.playerId != self.me.playerId);

            self.playerSlots.forEach(x=>x.destroy());

            let xx = [75, 375, 675];
            let ii = 0;
            otherPlayers.forEach(x=>{
                let my_xx = xx[ii++];
                self.playerSlots.push(x.render(self, my_xx, 70));
            });

            self.playerSlots.push(self.me.render(self, 10, 750));

            /*
            if ( self.players.length == 4 ) {                
                // lobby completed, go to game
                self.scene.start('Game', { socket: self.socket, players: self.players, me: self.me });
            }*/
        });

        this.socket.on('roomFull', function (roomName) {
            console.log(`Room ${roomName} is full, let's start`);
            // lobby completed, go to game
            self.scene.start('Game', { socket: self.socket, players: self.players, me: self.me });
        });
    }
}