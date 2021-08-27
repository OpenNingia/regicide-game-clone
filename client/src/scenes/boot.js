import io from 'socket.io-client';

export default class Boot extends Phaser.Scene {
    constructor() {
        super({
            key: 'Boot'
        });
    }

    preload() {
    }

    create() {
        let self = this;

        this.dealText = this.add.text(75, 350, ['CONNESSIONE AL SERVER...']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff');

        /** SOCKET CODE */

        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            // dev code
            this.socket = io('http://localhost:3000');
        } else {
            // production code
            this.socket = io('/');
        }        

        this.socket.on('connect', function () {
        	console.log('Connected!');
            self.scene.start('Lobby', { socket: self.socket });
        });
    }

}