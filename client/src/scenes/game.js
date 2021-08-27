import Card from '../helpers/card';
import Zone from '../helpers/zone';
import CastleZone from '../helpers/castleZone';
import Dealer from '../helpers/dealer';
import Player from '../helpers/player';
import io from 'socket.io-client';

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

        this.load.image('card-back1', 'src/assets/cards/card-back1.png');
        this.load.image('card-back2', 'src/assets/cards/card-back2.png');
        this.load.image('card-back3', 'src/assets/cards/card-back3.png');
        this.load.image('card-back4', 'src/assets/cards/card-back4.png');

        this.load.image('card-clubs-1', 'src/assets/cards/card-clubs-1.png');
        this.load.image('card-clubs-2', 'src/assets/cards/card-clubs-2.png');
        this.load.image('card-clubs-3', 'src/assets/cards/card-clubs-3.png');
        this.load.image('card-clubs-4', 'src/assets/cards/card-clubs-4.png');
        this.load.image('card-clubs-5', 'src/assets/cards/card-clubs-5.png');
        this.load.image('card-clubs-6', 'src/assets/cards/card-clubs-6.png');
        this.load.image('card-clubs-7', 'src/assets/cards/card-clubs-7.png');
        this.load.image('card-clubs-8', 'src/assets/cards/card-clubs-8.png');
        this.load.image('card-clubs-9', 'src/assets/cards/card-clubs-9.png');
        this.load.image('card-clubs-10', 'src/assets/cards/card-clubs-10.png');
        this.load.image('card-clubs-11', 'src/assets/cards/card-clubs-11.png');
        this.load.image('card-clubs-12', 'src/assets/cards/card-clubs-12.png');
        this.load.image('card-clubs-13', 'src/assets/cards/card-clubs-13.png');

        this.load.image('card-diamonds-1', 'src/assets/cards/card-diamonds-1.png');
        this.load.image('card-diamonds-2', 'src/assets/cards/card-diamonds-2.png');
        this.load.image('card-diamonds-3', 'src/assets/cards/card-diamonds-3.png');
        this.load.image('card-diamonds-4', 'src/assets/cards/card-diamonds-4.png');
        this.load.image('card-diamonds-5', 'src/assets/cards/card-diamonds-5.png');
        this.load.image('card-diamonds-6', 'src/assets/cards/card-diamonds-6.png');
        this.load.image('card-diamonds-7', 'src/assets/cards/card-diamonds-7.png');
        this.load.image('card-diamonds-8', 'src/assets/cards/card-diamonds-8.png');
        this.load.image('card-diamonds-9', 'src/assets/cards/card-diamonds-9.png');
        this.load.image('card-diamonds-10', 'src/assets/cards/card-diamonds-10.png');
        this.load.image('card-diamonds-11', 'src/assets/cards/card-diamonds-11.png');
        this.load.image('card-diamonds-12', 'src/assets/cards/card-diamonds-12.png');
        this.load.image('card-diamonds-13', 'src/assets/cards/card-diamonds-13.png');

        this.load.image('card-hearts-1', 'src/assets/cards/card-hearts-1.png');
        this.load.image('card-hearts-2', 'src/assets/cards/card-hearts-2.png');
        this.load.image('card-hearts-3', 'src/assets/cards/card-hearts-3.png');
        this.load.image('card-hearts-4', 'src/assets/cards/card-hearts-4.png');
        this.load.image('card-hearts-5', 'src/assets/cards/card-hearts-5.png');
        this.load.image('card-hearts-6', 'src/assets/cards/card-hearts-6.png');
        this.load.image('card-hearts-7', 'src/assets/cards/card-hearts-7.png');
        this.load.image('card-hearts-8', 'src/assets/cards/card-hearts-8.png');
        this.load.image('card-hearts-9', 'src/assets/cards/card-hearts-9.png');
        this.load.image('card-hearts-10', 'src/assets/cards/card-hearts-10.png');
        this.load.image('card-hearts-11', 'src/assets/cards/card-hearts-11.png');
        this.load.image('card-hearts-12', 'src/assets/cards/card-hearts-12.png');
        this.load.image('card-hearts-13', 'src/assets/cards/card-hearts-13.png');

        this.load.image('card-spades-1', 'src/assets/cards/card-spades-1.png');
        this.load.image('card-spades-2', 'src/assets/cards/card-spades-2.png');
        this.load.image('card-spades-3', 'src/assets/cards/card-spades-3.png');
        this.load.image('card-spades-4', 'src/assets/cards/card-spades-4.png');
        this.load.image('card-spades-5', 'src/assets/cards/card-spades-5.png');
        this.load.image('card-spades-6', 'src/assets/cards/card-spades-6.png');
        this.load.image('card-spades-7', 'src/assets/cards/card-spades-7.png');
        this.load.image('card-spades-8', 'src/assets/cards/card-spades-8.png');
        this.load.image('card-spades-9', 'src/assets/cards/card-spades-9.png');
        this.load.image('card-spades-10', 'src/assets/cards/card-spades-10.png');
        this.load.image('card-spades-11', 'src/assets/cards/card-spades-11.png');
        this.load.image('card-spades-12', 'src/assets/cards/card-spades-12.png');
        this.load.image('card-spades-13', 'src/assets/cards/card-spades-13.png');

        this.load.image('card-blank', 'src/assets/cards/card-blank.png');

        // particles
        this.load.image('fire', 'src/assets/muzzleflash3.png');
    }

    create() {
        console.log("create game scene");

        let self = this;

        this.dealText = this.add.text(75, 350, ['NUOVA PARTITA']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive();
        this.yourTurnText = this.add.text(75, 650, ['È IL TUO TURNO!']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setVisible(false);
        this.playCardsText = this.add.text(650, 700, ['CONFERMA']).setFontSize(18).setFontFamily('Trebuchet MS').setColor('#00ffff').setInteractive().setVisible(false);
        this.damageText = this.add.text(75, 650, ['HAI SUBITO DANNI!', 'SCARTA ABBASTANZA CARTE', 'PER CONTINUARE'])
            .setFontSize(16).setFontFamily('Trebuchet MS').setColor('#ff69b4').setVisible(false);

        // castle deck
        // discard pile
        // tavern deck
        this.deckText = this.add.text(1100, 50, ['', '', ''])
            .setFontSize(16).setFontFamily('Trebuchet MS').setColor('#ff69b4').setVisible(true);


        this.zone = new Zone(this);
        this.dropZone = this.zone.renderZone();
        this.dropZone.data.values.cards = [];

        this.castleZone = new CastleZone(this);
        this.castleZoneObj = this.castleZone.renderZone();        

        this.outline = this.zone.renderOutline(this.dropZone);
        this.castleOutline = this.castleZone.renderOutline(this.castleZoneObj);

        let xx = [75, 375, 675];
        let ii = 0;
        let otherPlayers = self.players.filter(x=>x.playerId != self.me.playerId);
        otherPlayers.forEach(x=>{
            let my_xx = xx[ii++];
            x.render(self, my_xx, 70);
        });        
        this.me.render(self, 10, 750)

        /** SOCKET CODE */

        // remove listeners to avoid listening multiple time to the same events
        this.socket.off('dealCards');
        this.socket.off('cardPlayed');
        this.socket.off('cardDraw');
        this.socket.off('gameInfo');

        // we receive also the event for the other players
        // this is not very cheat-proof :D
		this.socket.on('dealCards', function (players) {
            console.log('Received dealCards event', players);

            self.dealer.dealCards(players);
        })

        this.socket.on('gameInfo', function (gameInfo) {

            console.log('Received gameInfo event', gameInfo);

            self.dropZone.data.values.cards.forEach(x=>x.destroy());
            self.dropZone.data.values.cards = [];

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
                0.8,
                false,
                sprite);

            gameObject.disableInteractive();
            self.castleZoneObj.data.values.objects.push(gameObject);

            // HP and damage
            let remainingHp = gameInfo.current_monster_hp-gameInfo.current_inflicted_damage;
            let remainingDmg = gameInfo.current_monster_attack-gameInfo.current_shield;

            const hpDmgString = `HP ${remainingHp}/${gameInfo.current_monster_hp} | DMG ${remainingDmg}/${gameInfo.current_monster_attack}`;
            let hpDmgTextObj = self.add.text((self.castleZoneObj.x), (self.castleZoneObj.y+100), [hpDmgString]).setFontSize(14).setFontFamily('Trebuchet MS').setColor('#00ffff');
            self.castleZoneObj.data.values.objects.push(hpDmgTextObj);

            // update decks
            self.deckText.setText([`TAVERNA (${gameInfo.tavern_deck_size})`, `SCARTI (${gameInfo.discard_pile_size})`, `CASTELLO (${gameInfo.castle_deck_size})`])

            //

            self.setHandInteractive(false);
            self.yourTurnText.setVisible(false);
            self.playCardsText.setVisible(false);            
            self.damageText.setVisible(false);

            if (gameInfo.current_player_id == self.me.playerId) {
                console.log("ITS MY TURN!!!");
                
                if ( gameInfo.current_player_damage === 0 ) {
                    self.yourTurnText.setVisible(true);
                    self.playCardsText.setVisible(true);
                    self.setHandInteractive(true);   
                } else {
                    self.damageText.setText(['HAI SUBITO DANNI!', `SCARTA ${gameInfo.current_player_damage}`, 'PER CONTINUARE']);
                    self.damageText.setVisible(true); 
                    self.playCardsText.setVisible(true);
                    self.setHandInteractive(true); 
                }
            }
        })

        this.socket.on('cardPlayed', function (cardId, playerId) {
            console.log('Received cardPlayed event', cardId, playerId);
        })

        this.socket.on('cardDraw', function (cardId, playerId) {
            console.log('Received cardDraw event', cardId, playerId);
        })

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

		this.dealText.on('pointerdown', function () {
            self.socket.emit("dealCards", self.me.playerId);
        })

        this.dealText.on('pointerover', function () {
            self.dealText.setColor('#ff69b4');
        })

        this.dealText.on('pointerout', function () {
            self.dealText.setColor('#00ffff');
        })
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

    canPlayCards(cards) {
        if (cards.length == 0) {
            return false;
        }
        if (cards.length == 1) {
            return true;
        }

        // the jolly needs to be played alone
        if (cards.indexOf(53) >= 0 || cards.indexOf(54) >= 0) {
            return false;
        }

        // to play more than one card you need special rules
        // first of all check familiars        

        // 1, 14, 27, 40
        let familiars = cards.filter(x=>x===1||x===14||x===27||x===40);
        let not_familiars = cards.filter(x=>x!==1&&x!==14&&x!==27&&x!==40);

        // there can be at most one familiar
        if (familiars.length > 1) {
            return false;
        }

        let values = not_familiars.map(x=>x % 13);
        // 0 == 13
        values = values.map(x=>x == 0 ? 13 : x);

        // then we can play two or more cards
        // if they are the same
        // and their sum is equal or less than 10
        let sum = values.reduce((a, b) => a + b, 0);
        if ( sum > 10 ) {
            return false;
        }

        const allEqual = arr => arr.every( v => v === arr[0] )
        let all_equals = allEqual(values);

        return all_equals;
    }
}