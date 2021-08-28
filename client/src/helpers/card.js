import { randomChoose } from "./util";

export default class Card {
    constructor(scene, cardId) {
        this.cardId = cardId;

        let self = this;
        this.render = (x, y, scale, isDraggable, sprite) => {
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
                console.log('clicked on card', self.cardId);

                randomChoose(scene.card_slide_sfx).play();

                card.selected = !card.selected;                

                if ( card.selected ) {
                    card.setPosition(card.x, originalY - 20);
                } else {
                    card.setPosition(card.x, originalY);
                }
            })

            return card;
        }
    }
}