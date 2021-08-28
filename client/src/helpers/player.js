export default class Player {
    constructor(playerId, playerName) {

        this.playerId = playerId;
        this.playerName = playerName;
        this.playerReady = false;
        this.playerText = null;
        this.gameObjects = [];

        let self = this;

        this.render = (scene, x, y, is_active = false) => {
            const text = is_active ? `(*) ${self.playerName}` : self.playerName;

            self.playerText = scene.add
                .text(x, y, [text])
                .setFontSize(16)
                .setFontFamily('CompassPro')
                .setColor('#eeffff')
                .setInteractive();
            return self.playerText;
        }
    }
}