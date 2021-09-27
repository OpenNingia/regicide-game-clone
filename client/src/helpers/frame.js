export default class Opponent extends Phaser.GameObjects.Container {
    constructor(scene, x, y, w, h, title) {
       
        let frame = scene.add.image(0, 0, 'frame').setDisplaySize(w, h).setDepth(0).setOrigin(0);
        let text = scene.add.text(0, 0, title)
            .setFontSize(48)
            .setFontFamily('CompassPro')
            .setColor('#F2DDCC')
            .setDepth(1);

        text.setPosition( (w-text.displayWidth)/2, 30 );

        super(scene, x, y, [frame, text])

        this._frame = frame;
        this._text = text;

        scene.add.displayList.add(this);
    }      

    update(args) {
    }
}