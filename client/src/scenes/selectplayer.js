import Button from '../helpers/button';
import Frame from '../helpers/frame';

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
        
        const frame = new Frame(this, 290, 150, 700, 500, ['Seleziona il prossimo giocatore']).setDepth(3);

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

        let i = 0;
        let buttonGroup = this.add.group(            
            this.players.map(p => {
                return new Button(this, { ...stdButtonConfig }, 420, 260 + (i++*90), p.playerName).onClick(function () {
                    self.selectNextPlayer(p.playerId);
                });                
            })).setDepth(4);

        buttonGroup.runChildUpdate = true;
    }

    selectNextPlayer(playerId) {
        this.socket.emit('nextPlayer', playerId);
        this.scene.switch('Game');
    }
}