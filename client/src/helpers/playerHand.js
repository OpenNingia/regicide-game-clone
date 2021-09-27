import { randomChoose } from "./util";

// manages the player hand
export default class PlayerHand extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {        

        let sprites = [
            'card-back1',            

            'card-clubs-1',  // 1
            'card-clubs-2',
            'card-clubs-3',
            'card-clubs-4',
            'card-clubs-5',
            'card-clubs-6',
            'card-clubs-7',
            'card-clubs-8',
            'card-clubs-9',
            'card-clubs-10',
            'card-clubs-11', // J = 11
            'card-clubs-12', // Q = 12
            'card-clubs-13', // K = 13

            'card-diamonds-1',
            'card-diamonds-2',
            'card-diamonds-3',
            'card-diamonds-4',
            'card-diamonds-5',
            'card-diamonds-6',
            'card-diamonds-7',
            'card-diamonds-8',
            'card-diamonds-9',
            'card-diamonds-10',
            'card-diamonds-11', // J = 24
            'card-diamonds-12', // Q = 25
            'card-diamonds-13', // K = 26

            'card-hearts-1',
            'card-hearts-2',
            'card-hearts-3',
            'card-hearts-4',
            'card-hearts-5',
            'card-hearts-6',
            'card-hearts-7',
            'card-hearts-8',
            'card-hearts-9',
            'card-hearts-10',
            'card-hearts-11', // J = 37
            'card-hearts-12', // Q = 38
            'card-hearts-13', // K = 39

            'card-spades-1',
            'card-spades-2',
            'card-spades-3',
            'card-spades-4',
            'card-spades-5',
            'card-spades-6',
            'card-spades-7',
            'card-spades-8',
            'card-spades-9',
            'card-spades-10',
            'card-spades-11', // J = 50
            'card-spades-12', // J = 51
            'card-spades-13', // J = 52

            'card-joker-1',
            'card-joker-2',
        ]

        let cardGroup = scene.add.group();

        for (let j = 0; j < 7; j++) {
            //this._cardGroup.add(card.render(475 + (j * 100), 550, 1.0, true, 'card-back1'));
            let card = PlayerHand._renderCard(scene, (j * 100), 0, 1.0, 'card-back1').setOrigin(0);
            cardGroup.add(card);
        }         

        super(scene, x, y, cardGroup.getChildren());

        this._cardGroup = cardGroup;
        this._cardGroup.runChildUpdate = true;

        scene.add.displayList.add(this);

        this.getSprite = (cardId) => {
            return sprites[cardId];
        }   
    }

    setHandInteractive(flag) {
        if (flag) {
            this._cardGroup.getChildren().forEach(x=>x.setInteractive());
        } else {
            this._cardGroup.getChildren().forEach(x=>x.disableInteractive());
        }
        return this;
    }

    getSelectedCards() {
        return this._cardGroup.getChildren().filter(x=>x.selected === true).map(y=>y.cardId);            
    }

    clearSelectedCards() {
        return this._cardGroup.getChildren().forEach(x=>x.selected = false);
    }

    update(args) {
        let me = this.scene.me;

        for (let j = 0; j < 7; j++) {
            this._cardGroup.getChildren()[j].setVisible(j < me.playerHand.length);            
        }

        for (let j = 0; j < me.playerHand.length; j++) {
            let card = this._cardGroup.getChildren()[j];
            let cardId = me.playerHand[j];
            let cardTexture = this.getSprite(cardId);
            card.cardId = cardId;
            card.setTexture(cardTexture);

            if ( card.selected ) {
                card.setPosition(card.x, 0 - 20);
            } else {
                card.setPosition(card.x, 0);
            }
        } 
    }

    static _renderCard(scene, x, y, scale, sprite) {
        let card = scene.add.image(x, y, sprite).setScale(scale, scale).setInteractive();
        let originalY = y;
        card.cardId = self.cardId;
        card.selected = false;            

        card.on('pointerover', function () {
            card.setTint(0x00ffff);
            scene.card_hover_sfx.play();
        })

        card.on('pointerout', function () {
            card.setTint(0xffffff);
            scene.card_hover_sfx.stop();
        })

        card.on('pointerdown', function () {
            randomChoose(scene.card_slide_sfx).play();
            card.selected = !card.selected;                
        })

        return card;
    }
}