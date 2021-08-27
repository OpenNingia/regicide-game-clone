export default class Card {
    constructor(scene, cardId) {
        this.cardId = cardId;

        let self = this;
        this.render = (x, y, scale, isDraggable, sprite) => {
            let card = scene.add.image(x, y, sprite).setScale(scale, scale).setInteractive();
            card.cardId = self.cardId;
            card.selected = false;


            card.on('pointerdown', function () {
                console.log('clicked on card', self.cardId);
                card.selected = !card.selected;

                if ( card.selected ) {
                    card.particles = scene.add.particles('fire');
                    card.emitter = card.particles.createEmitter({
                        speed: 100,
                        lifespan: 300,
                        scale: { start: 0.5, end: 0 },
                        alpha: 0.6,
                        blendMode: 'ADD'
                    });
                    card.emitter.startFollow(card, -30, -40, true);
                } else {
                    card.emitter.remove();
                }
            })

            return card;
        }
    }
}