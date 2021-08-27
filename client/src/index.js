import Phaser from "phaser";
import Boot from "./scenes/boot";
import Lobby from "./scenes/lobby";
import Game from "./scenes/game";

const config = {
    type: Phaser.AUTO,
    parent: "regicide_game",
    width: 1280,
    height: 780,
    scene: [
        Boot,
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
