import Button from '../helpers/button';
import io from 'socket.io-client';

export default class SelectPlayer extends Phaser.Scene {
    constructor() {
        super({
            key: 'SelectPlayer'
        });
    }


    init(data) {
        console.log(`init SelectPlayer scene. ${data}`);
        this.socket = data.socket;
        this.players = data.players;
    }

    preload() {
    }

    create() {
        let self = this;
        
        const windowBox = this.add.rectangle(640, 360, 1100, 450, 0x0000ff, 0.8);
        const windowTitleBox = this.add.rectangle(640, 160, 1100, 50, 0xff000f, 0.4).setDepth(1);
        const title = this.add.text(400, 150, ['SELEZIONA IL PROSSIMO GIOCATORE']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setDepth(2);

        console.log(windowBox);

        let stdButtonConfig = {
            enabled: true,
            visible: true,
            color: '#00ffff',
            hoveringColor: '#ff69b4',
            disabledColor: '#eee',
            fontSize: 32,
            fontFamily: 'CompassPro'
        };

        let playerOneBtn = new Button(this, { ...stdButtonConfig }).onClick(function () {
            self.selectNextPlayer(0);
        });
        let playerTwoBtn = new Button(this, { ...stdButtonConfig }).onClick(function () {
            self.selectNextPlayer(1);
        });
        let playerThreeBtn = new Button(this, { ...stdButtonConfig }).onClick(function () {
            self.selectNextPlayer(2);
        });
        let playerFourBtn = new Button(this, { ...stdButtonConfig }).onClick(function () {
            self.selectNextPlayer(3);
        });

        let playerOneObj = null;
        let playerTwoObj = null;
        let playerThreeObj = null;
        let playerFourObj = null;

        if (this.players.length > 0) {
            playerOneObj = playerOneBtn.render(450, 330, `[${this.players[0].playerName}]`);
        }
        if (this.players.length > 1) {
            playerTwoObj = playerTwoBtn.render(450, 360, `[${this.players[1].playerName}]`);
        }
        if (this.players.length > 2) {
            playerThreeObj = playerThreeBtn.render(450, 390, `[${this.players[2].playerName}]`);
        }
        if (this.players.length > 3) {
            playerFourObj = playerFourBtn.render(450, 420, `[${this.players[3].playerName}]`);
        }
    }

    selectNextPlayer(idx) {
        console.log(`selected ${this.players[idx].playerName}`);
        this.socket.emit('nextPlayer', this.players[idx].playerId);
        this.scene.switch('Game');
    }
}