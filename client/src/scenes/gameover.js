export default class GameOver extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameOver'
        });
    }


    init(data) {
        console.log(`init gameover scene. ${data}`);
        this.socket = data.socket;
        this.message = data.message;
        this.i = 0;
    }

    preload() {
    }

    create() {
        let self = this;
        this.hsv = Phaser.Display.Color.HSVColorWheel();

        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        this.gameOverText = this.add.text(screenCenterX, screenCenterY, [this.message], { font: "74px Arial Black", fill: "#000" }).setInteractive().setOrigin(0.5);        
        this.gameOverText.setStroke('#fff', 16);
        this.gameOverText.setShadow(2, 2, "#333333", 2, true, true);

		this.gameOverText.on('pointerdown', function () {
            self.scene.start('Lobby', { socket: self.socket });
        })

        this.gameOverText.on('pointerover', function () {
            self.gameOverText.setColor('#ff69b4');
        })

        this.gameOverText.on('pointerout', function () {
            self.gameOverText.setColor('#00ffff');
        })     
    }

    update() {
        const top = this.hsv[this.i].color;
        const bottom = this.hsv[359 - this.i].color;

        this.gameOverText.setTint(top, bottom, top, bottom);

        this.i++;

        if (this.i === 360)
        {
            this.i = 0;
        }        
    }
}