export default class Player {
    constructor(playerId, playerName) {

        this.playerId = playerId;
        this.playerName = playerName;
        this.playerText = null;
        this.gameObjects = [];

        let self = this;

        this.render = (scene, x, y) => {
            self.playerText = scene.add
                .text(x, y, [self.playerName])
                .setFontSize(12)
                .setFontFamily('Trebuchet MS')
                .setColor('#eeffff')
                .setInteractive();
            return self.playerText;
        }
    }
}