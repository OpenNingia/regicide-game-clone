import Phaser from "phaser";
import Game from "./scenes/game";
import Lobby from "./scenes/lobby";

const config = {
    type: Phaser.AUTO,
    parent: "regicide_game",
    width: 1280,
    height: 780,
    scene: [
        Lobby,
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        parent: "regicide_game",
        width: 1280,
        height: 780,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },        
};

const game = new Phaser.Game(config);
