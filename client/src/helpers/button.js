export default class Button {
    constructor(scene, config) {
        
        let obj = null;
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
            if (self.obj != null) {
                self.obj.setText(textLines);
            }
        }

        this.setVisible = (flag) => {
            config.visible = flag;
            self.update();
            return this;
        }


        this.update = () => {
            if (self.obj == null) {
                return;
            }

            if (config.enabled) {
                self.obj.setColor(config.color);
            } else {
                self.obj.setColor(config.disabledColor);
            }

            self.obj.setVisible(config.visible);
        }

        this.render = (x, y, textLines) => {
            let text = scene.add.text(x, y, textLines)
                .setFontSize(config.fontSize)
                .setFontFamily('CompassPro')
                .setInteractive();
                       
            text.on('pointerover', function () {
                if (config.enabled) {
                    text.setColor(config.hoveringColor);
                }
            })
    
            text.on('pointerout', function () {
                if (config.enabled) {
                    text.setColor(config.color);
                } else {
                    text.setColor(config.disabledColor);
                }
            })

            text.on('pointerdown', function () {
                if (config.enabled) {
                    config.onclick();
                }
            })

            self.obj = text;
            self.update();

            return text;
        }
    }
}