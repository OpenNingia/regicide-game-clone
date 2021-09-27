export default class Button extends Phaser.GameObjects.Container {
    constructor(scene, config, x, y, textLines) {

        let bg = null;
        let text = null;
        if (config.texture) {
            bg = scene.add.image(0, 0, config.texture)
                                .setScale(config.textureScale ?? 0.3)
                                .setOrigin(0)
                                .setDepth(0);
        }

        let textX = bg ? bg.displayWidth/2 : 0;
        let textY = bg ? bg.displayHeight/2 : 0;

        text = scene.add.text(textX, textY, textLines)
            .setOrigin(0.5)
            .setFontSize(config.fontSize)
            .setFontFamily('CompassPro')
            .setDepth(0);

        // call container constructor
        if (bg) {
            super(scene, x, y, [bg, text]);
            this.setInteractive(new Phaser.Geom.Rectangle(0, 0, bg.displayWidth, bg.displayHeight), Phaser.Geom.Rectangle.Contains);
        } else {
            super(scene, x, y, [text]);
            this.setInteractive(new Phaser.Geom.Rectangle(0, 0, text.displayWidth, text.displayHeight), Phaser.Geom.Rectangle.Contains);
        }

        this.setExclusive(true);
        this.setVisible(true);

        this._bg = bg;
        this._text = text;       
        this._hovering = false;
        this._enabled = config.enabled;
        this._onclick = () => { };
        this._config = config;

        let self = this;

        this.on('pointerover', function () {
            console.log('hovering')
            self._hovering = true;
        })

        this.on('pointerout', function () {
            self._hovering = false;
        })

        this.on('pointerdown', function () {
            if (self._enabled) {
                self._onclick();
            }
        })

        scene.add.displayList.add(this);
    }     
    
    addedToScene() {
        
    }

    setEnabled(flag) {
        this._enabled = flag;
        return this;
    }

    onClick(func) {
        this._onclick = func;
        return this;
    }

    setText(textLines) {
        if (this._text != null) {
            this._text.setText(textLines);
        }
    }

    shutdown() {
        this._bg.shutdown();
        this._text.shutdown();
    }

    update(args) {
        if (this._enabled) {
            this._text.setColor(this._hovering ? this._config.hoveringColor : this._config.color);
        } else {
            this._text.setColor(this._config.disabledColor);
        }

        if (this._bg) {
            //this._bg.alpha = this._enabled ? 1.0 : 0.7;
            if (this._enabled && this._hovering) {
                const color = Phaser.Display.Color.HexStringToColor(this._config.hoveringColor).color;
                this._bg.setTint(color);
            } else if (!this._enabled) {
                const color = Phaser.Display.Color.HexStringToColor(this._config.disabledColor).color;
                this._bg.setTint(color);
            } else {
                this._bg.clearTint();
            }
        }
    }
}