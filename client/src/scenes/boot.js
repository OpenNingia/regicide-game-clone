import io from 'socket.io-client';
import { setupBackground, setupViewport } from '../helpers/util';

export default class Boot extends Phaser.Scene {
    constructor() {
        super({
            key: 'Boot'
        });
    }

    preload() {

        let gameConfig = this.sys.game.config;
        gameConfig.gameTitle = "Regicide Clone";
        gameConfig.gameVersion = "0.1.0";
        gameConfig.centerX = gameConfig.width / 2;
        gameConfig.centerY = gameConfig.height / 2;

        // progress bar
        this.createProgressbar(gameConfig.centerX, gameConfig.centerY, 500, 20);

        this.load.image('bg1', 'src/assets/bg/mountains.jpg');
		//this.load.image('bg1', 'src/assets/bg/far.png');
		//this.load.image('bg2', 'src/assets/bg/sand.png');
		//this.load.image('bg3', 'src/assets/bg/foregound-merged.png');

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

        this.load.image('card-joker-1', 'src/assets/cards/card-joker-1.png');
        this.load.image('card-joker-2', 'src/assets/cards/card-joker-2.png');

        this.load.image('card-blank', 'src/assets/cards/card-blank.png');

        // game ui
        this.load.image('old-scroll', 'src/assets/adom-oga-ui.png');
        this.load.image('button-full', 'src/assets/button-full.png');
        this.load.image('button-short', 'src/assets/button-short.png');
        this.load.image('frame', 'src/assets/frame.png');

        // sound effects
        this.load.audio('card-shuffle', 'src/assets/audio/sfx/cardShuffle.wav');

        this.load.audio('card-place-1', 'src/assets/audio/sfx/cardPlace1.wav');
        this.load.audio('card-place-2', 'src/assets/audio/sfx/cardPlace2.wav');
        this.load.audio('card-place-3', 'src/assets/audio/sfx/cardPlace3.wav');
        this.load.audio('card-place-4', 'src/assets/audio/sfx/cardPlace4.wav');

        this.load.audio('card-shove-1', 'src/assets/audio/sfx/cardShove1.wav');
        this.load.audio('card-shove-2', 'src/assets/audio/sfx/cardShove2.wav');
        this.load.audio('card-shove-3', 'src/assets/audio/sfx/cardShove3.wav');
        this.load.audio('card-shove-4', 'src/assets/audio/sfx/cardShove4.wav');

        this.load.audio('card-slide-1', 'src/assets/audio/sfx/cardSlide1.wav');
        this.load.audio('card-slide-2', 'src/assets/audio/sfx/cardSlide2.wav');
        this.load.audio('card-slide-3', 'src/assets/audio/sfx/cardSlide3.wav');
        this.load.audio('card-slide-4', 'src/assets/audio/sfx/cardSlide4.wav');
        this.load.audio('card-slide-5', 'src/assets/audio/sfx/cardSlide5.wav');
        this.load.audio('card-slide-6', 'src/assets/audio/sfx/cardSlide6.wav');
        this.load.audio('card-slide-7', 'src/assets/audio/sfx/cardSlide7.wav');
        this.load.audio('card-slide-8', 'src/assets/audio/sfx/cardSlide8.wav');

        this.load.audio('chip-lay-1', 'src/assets/audio/sfx/chipLay1.wav');

    }

    create() {
        let self = this;

        // handle resize
        window.addEventListener('resize', ()=>setupViewport(this.sys.game));
        
        setupViewport(this.sys.game);
        setupBackground(this);
        //const m = this.add.image(0, this.scale.height, 'bg1');

        // cursor
        this.input.setDefaultCursor('url(src/assets/cursors/sword.cur), pointer');

        let dealText = this.add.text(75, 450, ['CONNESSIONE AL SERVER...']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff');

        this.events.on('shutdown', function() {
            console.log("(BOOT SCENE) SHUTDOWN");
            dealText.destroy();
        });
    }

    createSocket() {
        /** SOCKET CODE */
        let self = this;

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
            //self.scene.start('Game', { socket: self.socket });
        });
    }


    createProgressbar(x, y, width, height){
        // Create text
        const styleText = {
            fill: 'black'
        };
        const loadingText = {
            x: x,
            y: y - 15,
            text: "Caricamento...",
            style: styleText
        };
        this.make.text(loadingText)
            .setOrigin(0.5);

        // Size and position
        this.width = width;
        this.height = height;
        this.xStart = x - this.width / 2;
        this.yStart = y - this.height / 2;
        this.color = 0xaaaaaa;

        // Border size
        let borderOffset = 2;

        let borderRect = new Phaser.Geom.Rectangle(
            this.xStart - borderOffset,
            this.yStart - borderOffset,
            this.width + borderOffset * 2,
            this.height + borderOffset * 2
        );

        let border = this.add.graphics({
            lineStyle: {
                width: 2,
                color: this.color
            }
        });
        border.strokeRectShape(borderRect);

        this.progressBar = this.add.graphics();
        
        // Implementation
        this.load.on('progress', this.updateProgressbar.bind(this));

        this.load.once('complete', () => {
            this.load.off('progress', this.updateProgressbar.bind(this));
            this.progressBar.destroy();
            this.createSocket();
        });

    }

    updateProgressbar(percentage){
        // console.log(`Now Loading: ${parseInt(percentage * 100)}%`);
        this.progressBar.clear();
        this.progressBar.fillStyle(this.color, 1);
        this.progressBar.fillRect(this.xStart, this.yStart, percentage * this.width, this.height);
    }    
}