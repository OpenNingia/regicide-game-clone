export default class Opponent extends Phaser.GameObjects.Container {
    constructor(scene, model, cardBack = 'card-back2', x = 0, y = 0) {
       
        let playerText = scene.add
            .text(0, 0, [model.playerName])
            .setFontSize(24)
            .setFontFamily('CompassPro')
            .setColor('#eeffff');            

        super(scene, x, y, [playerText])

        let cardGroup = []
        for(let i = 0; i < 7; i++) {
            let startX = 0;
            let y = 30;
            
            let cardObj = scene.add
                .image(startX + (i*20), y, cardBack)
                .setScale(0.4)
                .setDisplayOrigin(playerText.x);

            cardGroup.push(cardObj);
            this.add(cardObj);
        }        

        this.setExclusive(true);

        this._model = model;       
        this._playerText = playerText;
        this._cardGroup = cardGroup;

        scene.add.displayList.add(this);
    }      

    setModel(model) { this._model = model; }
    getModel() { return this._model; }

    update(args) {
        const text = this._model.activePlayer ? `(*) ${this._model.playerName}` : this._model.playerName;
        this._playerText.setText(text);

        let handSize = this._model.playerHand.length;        
        for(let i = 0; i < 7; i++) {
            this._cardGroup[i].setVisible(i < handSize);
        }
    }
}