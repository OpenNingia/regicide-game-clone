import Phaser from "phaser";
import Boot from "./scenes/boot";
import Lobby from "./scenes/lobby";
import Game from "./scenes/game";
import GameOver from "./scenes/gameover";
import SelectPlayer from "./scenes/selectplayer";

// SERVICE WORKER -- NEEDED FOR PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

const config = {
    type: Phaser.AUTO,
    parent: "regicide_game",
    width: 1280,
    height: 720,
    pixelArt: true,
    scene: [
        Boot,
        Lobby,
        Game,
        GameOver,
        SelectPlayer
    ],
    scale: {
        //mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
        mode: Phaser.Scale.FIT,
        parent: "regicide_game",
        width: 1280,
        height: 720,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

const game = new Phaser.Game(config);
