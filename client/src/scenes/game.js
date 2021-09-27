import Card from '../helpers/card';
import Zone from '../helpers/zone';
import CastleZone from '../helpers/castleZone';
import PlayerHand from '../helpers/playerHand';
import Button from '../helpers/button';
import Frame from '../helpers/frame';
import { setupBackground, randomChoose } from '../helpers/util';
import Opponent from '../helpers/opponent';
import { getCardString } from '../helpers/cardText';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game'
        });
    }

    init(data) {
        console.log("init game scene");
        console.log(data);
        this.socket = data.socket;
        this.players = data.players;
        this.me = data.me;        
    }

    preload() {
        console.log("preload game scene");

        this.card_place_sfx = [
            this.sound.add('card-place-1'),
            this.sound.add('card-place-2'),
            this.sound.add('card-place-3'),
            this.sound.add('card-place-4')];

        this.card_shove_sfx = [
            this.sound.add('card-shove-1'),
            this.sound.add('card-shove-2'),
            this.sound.add('card-shove-3'),
            this.sound.add('card-shove-4')];  
            
        this.card_slide_sfx = [
            this.sound.add('card-slide-1'),
            this.sound.add('card-slide-2'),
            this.sound.add('card-slide-3'),
            this.sound.add('card-slide-4'),
            this.sound.add('card-slide-5'),
            this.sound.add('card-slide-6'),
            this.sound.add('card-slide-7'),
            this.sound.add('card-slide-8')];


        this.card_hover_sfx = this.sound.add('chip-lay-1');
        this.card_shuffle_sfx = this.sound.add('card-shuffle');          
    }

    create() {
        console.log("create game scene");

        let self = this;

        setupBackground(this);     

        this.playerSlots = [];

        let stdButtonConfig = {
            enabled: true,
            visible: true,
            color: '#492811',
            hoveringColor: '#FFAE00',
            disabledColor: '#888',
            fontSize: 24,
            fontFamily: 'CompassPro',
            texture: 'button-short',
            textureScale: 0.4
        };

        // BOTTONE NUOVA PARTITA / DAI CARTE
        this.dealBtn = new Button(this, {...stdButtonConfig}, 20, 370, ['NUOVA PARTITA']).onClick(function() {
            self.socket.emit("dealCards", self.me.playerId);
        });                 

        // BOTTONE MANDA A MONTE
        this.abortBtn = new Button(this, {...stdButtonConfig}, 280, 370, ['A MONTE']).onClick(function() {
            self.socket.emit("gameOver");
        });         

        // BOTTONE GIOCA CARTE
        this.playCardsBtn = new Button(this, {...stdButtonConfig}, 20, 600, ['[GIOCA]']).onClick(function() {
            self.playCards();
        }).setVisible(false); 
       
        // BOTTONE PASSA TURNO
        this.passTurnBtn = new Button(this, {...stdButtonConfig}, 280, 600, ['[PASSA]']).onClick(function() {
            self.passTurn();            
        }).setVisible(false); 

        // FRAME MESSAGGI
        let msgFrame = new Frame(this, 840, 400, 420, 300, []).setDepth(0);

        //this.dmgText = ['HAI SUBITO DANNI!', 'SCARTA ABBASTANZA CARTE', 'PER CONTINUARE'];
        this.textColor = '#F2DDCC';
        this.dmgTextColor = '#FF5B00';

        this.messageArea = this.add.rexBBCodeText(860, 420, '', 
            { 
                fontFamily: 'CompassPro', 
                fontSize: 32, 
                color: '#F2DDCC',
                wrap: {
                    mode: 'word',
                    width: 400
                },                
            });       

        // FRAME MAZZI
        let deckFrame = new Frame(this, 940, 115, 320, 250, ['Mazzi']).setDepth(0);

        // NOMI MAZZI CASTELLO, SCARTI E TAVERNA
        this.deckLabel = this.add.text(980, 200, ['Taverna', 'Scarti', 'Castello'])
            .setFontSize(32).setFontFamily('CompassPro').setColor('#F2DDCC').setVisible(true);
        // CONTEGGIO MAZZI
        this.deckText = this.add.text(1180, 200, ['', '', ''])
            .setFontSize(32).setFontFamily('CompassPro').setColor('#FFDDCC').setVisible(true);

        // CARD DROP ZONE
        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.dropZone.data.values.cards = [];

        // ZONA DEL CASTELLO
        this.castleZone = new CastleZone(this);
        this.castleZoneObj = this.castleZone.renderZone();
        let castleSeparator = this.add.graphics()
            .setDepth(2)
            .lineStyle(4, 0xD0A880)
            .beginPath()
            .moveTo(750, 130)
            .lineTo(750, 350)
            .closePath()
            .strokePath();
        
        this.controls = this.add.group([this.dealBtn, this.abortBtn, this.playCardsBtn, this.passTurnBtn]);
        this.controls.runChildUpdate = true;

        // create other players
        let otherPlayers = self.players.filter(x=>x.playerId != self.me.playerId);

        let columns = [30, 330, 630];
        let cardBacks = ['card-back2', 'card-back3', 'card-back4']
        let index = 0;
        
        this.playersGroup =  this.add.group(
            otherPlayers.map(p=>{
                const x = columns[index];
                const cb = cardBacks[index];
                index++;
                return new Opponent(self, p, cb, x, 20);
            })    
        );
        this.playersGroup.runChildUpdate = true;        

        // DRAW MY NAME
        let myName = this.add
            .text(20, 690, [self.me.playerName])
            .setFontSize(24)
            .setFontFamily('CompassPro')
            .setColor('#eeffff');  

        this.boardGroup = this.add.group();
        this.messageLog = [];
        this.lastGameInfo = null;

        /** SOCKET CODE */

        this.socket.off('dealCards');
        this.socket.off('shuffleCards');
        this.socket.off('gameInfo');
        this.socket.off('nextPlayer');
        this.socket.off('cardPlayed');
        this.socket.off('cardDraw');
        this.socket.off('cardDiscarded');
        this.socket.off('gameOver');
        this.socket.off('enemyKilled');   

        // we receive also the event for the other players
        // this is not very cheat-proof :D
		this.socket.on('dealCards', function (players) {
            console.log('Received dealCards event', players);            
        })   

		this.socket.on('shuffleCards', function () {
            console.log('Received shuffleCards event');
            self.card_shuffle_sfx.play({ rate: 2 });
        })

        this.socket.on('gameInfo', function (gameInfo, players) {

            console.log('Received gameInfo event', gameInfo, players);

            if (players.length !== self.players.length) {
                // go back to lobby
                self.scene.start('Lobby', { socket: self.socket, players: self.players, me: self.me });
                return;
            }

            // update player hands
            self.me.playerHand = players.find(p=>p.playerId===self.me.playerId).playerHand;
            self.players.forEach(p=>{
                p.playerHand = players.find(x=>x.playerId===p.playerId).playerHand;
            });

            //self.dropZone.data.values.cards.forEach(x=>x.destroy());
            //self.dropZone.data.values.cards = [];
            self.boardGroup.clear(true, true);

            // update board
            gameInfo.board.forEach(cardId => {

                let card = new Card(self, cardId);
                let sprite = self.dealer.getSprite(cardId);

                let gameObjectX = 30 + self.dropZone.x + ((self.boardGroup.getLength()+1) * 50);
                let gameObjectY = 125 + self.dropZone.y;

                let gameObject = card.render(
                    gameObjectX, gameObjectY,
                    1.0,
                    false,
                    sprite);

                gameObject.disableInteractive();
                self.boardGroup.add(gameObject);

                console.log(`Place card ${cardId} into board at ${gameObjectX}, ${gameObjectY} with texture ${sprite}`);
            });

            // update castle
            self.castleZoneObj.data.values.objects.forEach(x=>x.destroy());
            self.castleZoneObj.data.values.objects = [];

            let card = new Card(self, gameInfo.current_monster);
            let sprite = self.dealer.getSprite(gameInfo.current_monster);

            let gameObjectX = (self.castleZoneObj.x);
            let gameObjectY = (self.castleZoneObj.y);

            let gameObject = card.render(
                gameObjectX, gameObjectY,
                1.0,
                false,
                sprite);

            gameObject.disableInteractive();
            self.castleZoneObj.data.values.objects.push(gameObject);

            // HP and damage
            let remainingHp = gameInfo.current_monster_hp-gameInfo.current_inflicted_damage;
            let remainingDmg = Math.max(0, gameInfo.current_monster_attack-gameInfo.current_shield);

            const hpString = `HP ${remainingHp}/${gameInfo.current_monster_hp}`;
            const dmgString = `DMG ${remainingDmg}/${gameInfo.current_monster_attack}`;
            let hpTextObj = self.add.text((self.castleZoneObj.x-50), (self.castleZoneObj.y+80), [hpString, dmgString])
                .setFontSize(32)
                .setFontFamily('CompassPro')
                .setColor('#492811');

            self.castleZoneObj.data.values.objects.push(hpTextObj);

            // update decks
            self.deckText.setText([`(${gameInfo.tavern_deck_size})`, `(${gameInfo.discard_pile_size})`, `(${gameInfo.castle_deck_size})`])
            //

            // update current player 
            self.players.forEach(x=>{
                if (x.playerId!==gameInfo.current_player_id) {
                    x.activePlayer = false;
                } else {
                    x.activePlayer = true;
                }
            });

            const currentPlayer = players.find(x=>x.playerId===gameInfo.current_player_id);

            const isMyTurn = gameInfo.current_player_id == self.me.playerId;
            const myHand = players.find(x=>x.playerId === self.me.playerId).playerHand;

            const doIHaveAnyCards = myHand.length > 0;
            const doIHaveDamage = gameInfo.current_player_damage > 0;

            self.dealer.setHandInteractive(isMyTurn);

            self.playCardsBtn.setVisible(isMyTurn && doIHaveAnyCards);
            self.passTurnBtn.setVisible(isMyTurn);

            const isGameStarted = gameInfo.started;
            const enoughPlayers = players.length > 1;
            self.dealBtn.setEnabled(!isGameStarted && enoughPlayers);
            self.abortBtn.setEnabled(isGameStarted);

            // if changed player then we need to tell the players
            if (currentPlayer && (gameInfo.current_player_id !== this.lastGameInfo?.current_player_id)) {
                if (isMyTurn) {
                    self.addToLog('[u]È il tuo turno![/u]');
                } else {
                    self.addToLog(`È il turno di [color=green]${currentPlayer.playerName}[/color]`);
                }
            }

            if (doIHaveDamage) {
                self.addToLog(`[color=#FF5B00]HAI SUBITO DANNI! SCARTA ${gameInfo.current_player_damage} PER CONTINUARE[/color]`);
            }

            this.lastGameInfo = gameInfo;
        })

        this.socket.on('nextPlayer', function () {
            console.log('Received nextPlayer event');
            // I need to choose the next player            
            self.scene.pause().launch('SelectPlayer', { socket: self.socket, players: self.players });
        })

        this.socket.on('cardPlayed', function (cardId, playerId) {
            console.log('Received cardPlayed event', cardId, playerId);
            randomChoose(self.card_place_sfx).play();            
        })

        this.socket.on('cardDraw', function (cardId, playerId) {
            console.log('Received cardDraw event', cardId, playerId);
            randomChoose(self.card_shove_sfx).play();
        })

        this.socket.on('cardsDiscarded', function (cards, playerId) {
            console.log('Received cardsDiscarded event', cards, playerId);
            randomChoose(self.card_shove_sfx).play();
        })        

        this.socket.on('gameOver', function(youWin) {
            if (youWin === true) {
                self.scene.start('GameOver', { socket: self.socket, players: self.players, me: self.me, message: "VITTORIA!!!" });
            } else {
                self.scene.start('GameOver', { socket: self.socket, players: self.players, me: self.me, message: "SCONFITTA :(" });
            }
        });

        this.socket.on('enemyKilled', function(enemy, playerId, isExactKill) {
            let message = "";
            let enemyString = getCardString(enemy);

            if (playerId === self.me.playerId) {
                message = `Hai ucciso [b]${enemyString}[/b].`;
            } else {
                message = `${playerId} ha ucciso [b]${enemyString}[/b].`;
            }

            if (isExactKill) {
                message += ' Uccisione perfetta!';
            }

            if (playerId === self.me.playerId) {
                message += ' Gioca ancora.';
            }

            self.addToLog(message);
        });        

        /** END SOCKET CODE */

        this.dealer = new PlayerHand(this, 20, 450);

        // DEBUG: grid
        // this.grid = this.add.grid(0, 0, this.sys.game.config.width, this.sys.game.config.height, 50, 50, null, null, 0, 0.2).setOrigin(0);

        // request game information
        this.socket.emit('gameInfo');
    }

    update() {        
        this.dealer.update();

        // update messageLog
        this.messageArea.setText(this.messageLog);
    }

    shutdown() {
        // remove listeners to avoid listening multiple time to the same events
        this.socket.off('dealCards');
        this.socket.off('shuffleCards');
        this.socket.off('gameInfo');
        this.socket.off('nextPlayer');
        this.socket.off('cardPlayed');
        this.socket.off('cardDraw');
        this.socket.off('cardDiscarded');
        this.socket.off('gameOver');
        this.socket.off('enemyKilled');        
        
        self.controls.destroy();
    }

    playCards() {
        if ( this.me !== null ) {
            let cards = this.dealer.getSelectedCards();

            if (this.canPlayCards(cards)) {
                this.socket.emit('cardPlayed', cards, this.me.playerId);
                this.dealer.clearSelectedCards();
            }
        }
    }

    passTurn() {
        if ( this.me !== null ) {
            this.socket.emit('cardPlayed', [], this.me.playerId);
            this.dealer.clearSelectedCards();
        }
    }

    canPlayCards(cards) {
        return cards.length > 0;
    }

    addToLog(text) {
        const MaxLines = 3;
        if (this.messageLog.length > MaxLines) {
            this.messageLog.shift();
        }
        this.messageLog.push(text);
    }
}