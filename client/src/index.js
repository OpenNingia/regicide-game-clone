import Phaser from "phaser";
import Game from "./scenes/game";
import Lobby from "./scenes/lobby";

const config = {
    type: Phaser.AUTO,
    parent: "regicide",
    width: 1280,
    height: 780,
    scene: [
        Lobby,
        Game
    ]
};

const game = new Phaser.Game(config);