export default class Button {
    constructor(scene, config) {
        
        let bg = null;
        let text = null;
        let hovering = false;      
        let self = this;

        this.setEnabled = (flag) => {
            config.enabled = flag;
            self.update();
            return this;
        }

        this.onClick = (func) => {
            config.onclick = func;
            return this;
        }

        this.setText = (textLines) => {
            if (self.text != null) {
                self.text.setText(textLines);
            }
        }

        this.setVisible = (flag) => {
            config.visible = flag;
            self.update();
            return this;
        }


        this.update = () => {
            if (self.container == null) {
                return;
            }

            if (config.enabled) {
                self.text.setColor(self.hovering ? config.hoveringColor : config.color);
            } else {
                self.text.setColor(config.disabledColor);
            }

            if (self.bg) {
                self.bg.alpha = config.enabled ? 1.0 : 0.5;
                if (config.enabled && self.hovering) {
                    const color = Phaser.Display.Color.HexStringToColor(config.hoveringColor).color;
                    self.bg.setTint(color);
                } else {
                    self.bg.clearTint();
                }
            }

            self.container.setVisible(config.visible);
        }

        this.render = (x, y, textLines) => {            

            if (config.texture) {
                self.bg = scene.add.image(0, 0, config.texture)
                                    .setScale(0.3)
                                    .setOrigin(0)
                                    .setDepth(0);
            }    

            self.text = scene.add.text(40, 20, textLines)
                .setOrigin(0)
                .setFontSize(config.fontSize)
                .setFontFamily('CompassPro')
                .setDepth(0);

            if (self.bg) {
                self.container = scene.add.container(x, y, [self.bg, self.text])
                    .setInteractive(new Phaser.Geom.Rectangle(0, 0, self.bg.displayWidth, self.bg.displayHeight), Phaser.Geom.Rectangle.Contains);
            } else {
                self.container = scene.add.container(x, y, [self.text])
                    .setInteractive(new Phaser.Geom.Rectangle(0, 0, self.text.displayWidth, self.text.displayHeight), Phaser.Geom.Rectangle.Contains);
            }

            self.container.setExclusive(true)
                
                       
            self.container.on('pointerover', function () {
                self.hovering = true;
                self.update();
            })
    
            self.container.on('pointerout', function () {
                self.hovering = false;
                self.update();
            })

            self.container.on('pointerdown', function () {
                if (config.enabled) {
                    config.onclick();
                }
            })

            self.update();

            return self.container;
        }
    }
}