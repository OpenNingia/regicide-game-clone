export default class PlayerModel {
    constructor(playerId, playerName, ready = false) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.playerReady = ready;
        this.playerHand = [];
        this.activePlayer = false;
    }      
}