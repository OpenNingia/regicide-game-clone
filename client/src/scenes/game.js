import Card from '../helpers/card';
import Zone from '../helpers/zone';
import CastleZone from '../helpers/castleZone';
import Dealer from '../helpers/dealer';
import Player from '../helpers/player';
import io from 'socket.io-client';
import { setupBackground, randomChoose } from '../helpers/util';

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
        this.dealText = this.add.text(75, 275, ['[NUOVA]', '[PARTITA]']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setInteractive();
        this.yourTurnText = this.add.text(75, 580, ['È IL TUO TURNO!']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setVisible(false);
        this.playCardsText = this.add.text(530, 650, ['[GIOCA]']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setInteractive().setVisible(false);
        this.passTurnText = this.add.text(690, 650, ['[PASSA]']).setFontSize(32).setFontFamily('CompassPro').setColor('#00ffff').setInteractive().setVisible(false);
        this.damageText = this.add.text(75, 580, ['HAI SUBITO DANNI!', 'SCARTA ABBASTANZA CARTE', 'PER CONTINUARE'])
            .setFontSize(24).setFontFamily('CompassPro').setColor('#ff69b4').setVisible(false);

        // castle deck
        // discard pile
        // tavern deck
        this.deckLabel = this.add.text(1050, 70, ['TAVERNA', 'SCARTI', 'CASTELLO'])
            .setFontSize(16).setFontFamily('CompassPro').setColor('#ff69b4').setVisible(true);
        this.deckText = this.add.text(1130, 70, ['', '', ''])
            .setFontSize(16).setFontFamily('CompassPro').setColor('#ff69b4').setVisible(true);


        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.dropZone.data.values.cards = [];

        this.zoneBg = this.add.image(550, 300, 'old-scroll');
        this.zoneBg.setScale(0.3).setDepth(0);

        this.castleZone = new CastleZone(this);
        this.castleZoneObj = this.castleZone.renderZone();

        //this.outline = this.zone.renderOutline(this.dropZone);
        //this.castleOutline = this.castleZone.renderOutline(this.castleZoneObj);

        /** SOCKET CODE */

        // remove listeners to avoid listening multiple time to the same events
        this.socket.off('dealCards');
        this.socket.off('gameInfo');

        this.socket.off('cardPlayed');
        this.socket.off('cardDraw');
        this.socket.off('cardsDiscarded');

        this.socket.off('shuffleCards');


        // we receive also the event for the other players
        // this is not very cheat-proof :D
		this.socket.on('dealCards', function (players) {
            console.log('Received dealCards event', players);            
            //self.dealer.dealCards(players);
        })

		this.socket.on('shuffleCards', function () {
            console.log('Received shuffleCards event');            
            self.card_shuffle_sfx.play({ rate: 2 });
        })

        this.socket.on('gameInfo', function (gameInfo, players) {

            console.log('Received gameInfo event', gameInfo, players);

            self.dealer.dealCards(players);

            self.dropZone.data.values.cards.forEach(x=>x.destroy());
            self.dropZone.data.values.cards = [];

            // update players
            let otherPlayers = self.players.filter(x=>x.playerId != self.me.playerId);
            self.playerSlots.forEach(x=>x.destroy());
            self.playerSlots = [];

            let xx = [30, 330, 630];
            let ii = 0;
            otherPlayers.forEach(x=>{
                const my_xx = xx[ii++];
                const is_current_player = gameInfo.current_player_id === x.playerId;
                self.playerSlots.push(x.render(self, my_xx, 30, is_current_player));
            });
            self.playerSlots.push(self.me.render(self, 30, 690));

            // update board
            gameInfo.board.forEach(cardId => {

                let card = new Card(self, cardId);
                let sprite = self.dealer.getSprite(cardId);

                let gameObjectX = ((self.dropZone.x - 250) + ((self.dropZone.data.values.cards.length+1) * 50));
                let gameObjectY = (self.dropZone.y);

                let gameObject = card.render(
                    gameObjectX, gameObjectY,
                    0.6,
                    false,
                    sprite);

                gameObject.disableInteractive();
                self.dropZone.data.values.cards.push(gameObject);
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
            let remainingDmg = gameInfo.current_monster_attack-gameInfo.current_shield;

            const hpDmgString = `HP ${remainingHp}/${gameInfo.current_monster_hp} | DMG ${remainingDmg}/${gameInfo.current_monster_attack}`;
            let hpDmgTextObj = self.add.text((self.castleZoneObj.x-50), (self.castleZoneObj.y+100), [hpDmgString]).setFontSize(16).setFontFamily('CompassPro').setColor('#00ffff');
            self.castleZoneObj.data.values.objects.push(hpDmgTextObj);

            // update decks
            //self.deckText.setText([`TAVERNA   (${gameInfo.tavern_deck_size})`, `SCARTI      (${gameInfo.discard_pile_size})`, `CASTELLO (${gameInfo.castle_deck_size})`])
            self.deckText.setText([`(${gameInfo.tavern_deck_size})`, `(${gameInfo.discard_pile_size})`, `(${gameInfo.castle_deck_size})`])

            //

            self.setHandInteractive(false);
            self.yourTurnText.setVisible(false);
            self.playCardsText.setVisible(false);
            self.passTurnText.setVisible(false);
            self.damageText.setVisible(false);

            if (gameInfo.current_player_id == self.me.playerId) {
                console.log("ITS MY TURN!!!");

                if ( gameInfo.current_player_damage === 0 ) {
                    self.yourTurnText.setVisible(true);
                    self.playCardsText.setVisible(true);
                    self.passTurnText.setInteractive().setColor('#00ffff').setVisible(true);
                    self.setHandInteractive(true);
                } else {
                    self.damageText.setText(['HAI SUBITO DANNI!', `SCARTA ${gameInfo.current_player_damage}`, 'PER CONTINUARE']);
                    self.damageText.setVisible(true);
                    self.playCardsText.setVisible(true);
                    self.passTurnText.disableInteractive().setColor('#eee').setVisible(true);
                    self.setHandInteractive(true);
                }
            }
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
                self.scene.start('GameOver', { socket: self.socket, message: "VITTORIA!!!" });
            } else {
                self.scene.start('GameOver', { socket: self.socket, message: "SCONFITTA :(" });
            }
        });

        /** END SOCKET CODE */

        this.dealer = new Dealer(this);

		this.playCardsText.on('pointerdown', function () {
            self.playCards();
        })

        this.playCardsText.on('pointerover', function () {
            self.playCardsText.setColor('#ff69b4');
        })

        this.playCardsText.on('pointerout', function () {
            self.playCardsText.setColor('#00ffff');
        })

		this.passTurnText.on('pointerdown', function () {
            self.passTurn();
        })

        this.passTurnText.on('pointerover', function () {
            self.passTurnText.setColor('#ff69b4');
        })

        this.passTurnText.on('pointerout', function () {
            self.passTurnText.setColor('#00ffff');
        })        

		this.dealText.on('pointerdown', function () {
            self.socket.emit("dealCards", self.me.playerId);
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })

        // mouse trail
        /*
        this.mouse_trail = this.add.particles('fire').createEmitter({
            x: 0,
            y: 720,
            speed: { min: 100, max: 200 },
            angle: { min: -85, max: -95 },
            scale: { start: 0, end: 0.5, ease: 'Back.easeOut' },
            alpha: { start: 1, end: 0, ease: 'Quart.easeOut' },
            blendMode: 'SCREEN',
            lifespan: 1000
        });
        this.mouse_trail.reserve(1000);        

        this.input.on('pointermove', function (pointer) {
            self.mouse_trail.setPosition(pointer.x, pointer.y);
        });     */   

        // request game information
        this.socket.emit('gameInfo');
    }

    update() {

    }

    setHandInteractive(flag) {
        if ( this.me !== null ) {
            if (flag) {
                this.me.gameObjects.forEach(x=>x.setInteractive());
            } else {
                this.me.gameObjects.forEach(x=>x.disableInteractive());
            }
        }
    }

    playCards() {
        if ( this.me !== null ) {
            let cards = this.me.gameObjects.filter(x=>x.selected === true).map(y=>y.cardId);

            if (this.canPlayCards(cards)) {
                this.socket.emit('cardPlayed', cards, this.me.playerId);
            }
        }
    }

    passTurn() {
        if ( this.me !== null ) {
            this.socket.emit('cardPlayed', [], this.me.playerId);
        }
    }    

    canPlayCards(cards) {
        return cards.length > 0;
    }
}