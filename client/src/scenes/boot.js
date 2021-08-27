import io from 'socket.io-client';
import { setupBackground } from '../helpers/util';

export default class Boot extends Phaser.Scene {
    constructor() {
        super({
            key: 'Boot'
        });
    }

    preload() {
		this.load.image('bg1', 'src/assets/bg/far.png');
		this.load.image('bg2', 'src/assets/bg/sand.png');
		this.load.image('bg3', 'src/assets/bg/foregound-merged.png');

        this.load.image('card-back1', 'src/assets/cards/card-back1.png');
        this.load.image('card-back2', 'src/assets/cards/card-back2.png');
        this.load.image('card-back3', 'src/assets/cards/card-back3.png');
        this.load.image('card-back4', 'src/assets/cards/card-back4.png');

        this.load.image('card-clubs-1', 'src/assets/cards/card-clubs-1.png');
        this.load.image('card-clubs-2', 'src/assets/cards/card-clubs-2.png');
        this.load.image('card-clubs-3', 'src/assets/cards/card-clubs-3.png');
        this.load.image('card-clubs-4', 'src/assets/cards/card-clubs-4.png');
        this.load.image('card-clubs-5', 'src/assets/cards/card-clubs-5.png');
        this.load.image('card-clubs-6', 'src/assets/cards/card-clubs-6.png');
        this.load.image('card-clubs-7', 'src/assets/cards/card-clubs-7.png');
        this.load.image('card-clubs-8', 'src/assets/cards/card-clubs-8.png');
        this.load.image('card-clubs-9', 'src/assets/cards/card-clubs-9.png');
        this.load.image('card-clubs-10', 'src/assets/cards/card-clubs-10.png');
        this.load.image('card-clubs-11', 'src/assets/cards/card-clubs-11.png');
        this.load.image('card-clubs-12', 'src/assets/cards/card-clubs-12.png');
        this.load.image('card-clubs-13', 'src/assets/cards/card-clubs-13.png');

        this.load.image('card-diamonds-1', 'src/assets/cards/card-diamonds-1.png');
        this.load.image('card-diamonds-2', 'src/assets/cards/card-diamonds-2.png');
        this.load.image('card-diamonds-3', 'src/assets/cards/card-diamonds-3.png');
        this.load.image('card-diamonds-4', 'src/assets/cards/card-diamonds-4.png');
        this.load.image('card-diamonds-5', 'src/assets/cards/card-diamonds-5.png');
        this.load.image('card-diamonds-6', 'src/assets/cards/card-diamonds-6.png');
        this.load.image('card-diamonds-7', 'src/assets/cards/card-diamonds-7.png');
        this.load.image('card-diamonds-8', 'src/assets/cards/card-diamonds-8.png');
        this.load.image('card-diamonds-9', 'src/assets/cards/card-diamonds-9.png');
        this.load.image('card-diamonds-10', 'src/assets/cards/card-diamonds-10.png');
        this.load.image('card-diamonds-11', 'src/assets/cards/card-diamonds-11.png');
        this.load.image('card-diamonds-12', 'src/assets/cards/card-diamonds-12.png');
        this.load.image('card-diamonds-13', 'src/assets/cards/card-diamonds-13.png');

        this.load.image('card-hearts-1', 'src/assets/cards/card-hearts-1.png');
        this.load.image('card-hearts-2', 'src/assets/cards/card-hearts-2.png');
        this.load.image('card-hearts-3', 'src/assets/cards/card-hearts-3.png');
        this.load.image('card-hearts-4', 'src/assets/cards/card-hearts-4.png');
        this.load.image('card-hearts-5', 'src/assets/cards/card-hearts-5.png');
        this.load.image('card-hearts-6', 'src/assets/cards/card-hearts-6.png');
        this.load.image('card-hearts-7', 'src/assets/cards/card-hearts-7.png');
        this.load.image('card-hearts-8', 'src/assets/cards/card-hearts-8.png');
        this.load.image('card-hearts-9', 'src/assets/cards/card-hearts-9.png');
        this.load.image('card-hearts-10', 'src/assets/cards/card-hearts-10.png');
        this.load.image('card-hearts-11', 'src/assets/cards/card-hearts-11.png');
        this.load.image('card-hearts-12', 'src/assets/cards/card-hearts-12.png');
        this.load.image('card-hearts-13', 'src/assets/cards/card-hearts-13.png');

        this.load.image('card-spades-1', 'src/assets/cards/card-spades-1.png');
        this.load.image('card-spades-2', 'src/assets/cards/card-spades-2.png');
        this.load.image('card-spades-3', 'src/assets/cards/card-spades-3.png');
        this.load.image('card-spades-4', 'src/assets/cards/card-spades-4.png');
        this.load.image('card-spades-5', 'src/assets/cards/card-spades-5.png');
        this.load.image('card-spades-6', 'src/assets/cards/card-spades-6.png');
        this.load.image('card-spades-7', 'src/assets/cards/card-spades-7.png');
        this.load.image('card-spades-8', 'src/assets/cards/card-spades-8.png');
        this.load.image('card-spades-9', 'src/assets/cards/card-spades-9.png');
        this.load.image('card-spades-10', 'src/assets/cards/card-spades-10.png');
        this.load.image('card-spades-11', 'src/assets/cards/card-spades-11.png');
        this.load.image('card-spades-12', 'src/assets/cards/card-spades-12.png');
        this.load.image('card-spades-13', 'src/assets/cards/card-spades-13.png');

        this.load.image('card-blank', 'src/assets/cards/card-blank.png');

        // particles
        this.load.image('fire', 'src/assets/muzzleflash3.png');

        // old scroll
        this.load.image('old-scroll', 'src/assets/old_scroll_dark.png');
    }

    create() {
        let self = this;

        setupBackground(this);

        this.dealText = this.add.text(75, 350, ['CONNESSIONE AL SERVER...']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff');

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