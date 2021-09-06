const PORT = process.env.PORT || 3000

const path = require('path');
const express = require('express');
const server = express();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});
const shuffle = require('knuth-shuffle');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
//const { PRIORITY_NORMAL } = require('constants');

const pino = require('pino');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

// Create a logging instance
const logger = pino({
    //level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    level: 'trace'
});

const MAX_HAND_SIZES = [0, 0, 7, 6, 5];

const JACKS = [11, 24, 37, 50];
const QUEENS = [12, 25, 38, 51];
const KINGS = [13, 26, 39, 52];

class Player {
    constructor(playerId, playerName) {

        this.playerId = playerId;
        this.playerName = playerName;
        this.playerHand = [];
        this.ready = false;
    }
}

class GameInfo {
    constructor() {
        this.current_player_id = '';
        this.current_monster = 0;
        this.current_monster_hp = 0;
        this.current_inflicted_damage = 0;
        this.current_monster_attack = 0;
        this.potential_shield = 0;
        this.current_shield = 0;
        this.monster_has_immunity = true;
        this.tavern_deck_size = 0;
        this.castle_deck_size = 0;
        this.discard_pile_size = 0;
        this.current_player_damage = 0;
        this.started = false;
        this.board = [];
    }
}

// FREE FUNCTIONS //

function isValidPlay(cards) {
    if (cards.length == 0) {
        return true;
    }
    if (cards.length == 1) {
        return true;
    }

    // the jester needs to be played alone
    if (cards.indexOf(53) >= 0 || cards.indexOf(54) >= 0) {
        return false;
    }

    // to play more than one card you need special rules
    // first of all check familiars

    // 1, 14, 27, 40
    let familiars = cards.filter(x => x === 1 || x === 14 || x === 27 || x === 40);
    let not_familiars = cards.filter(x => x !== 1 && x !== 14 && x !== 27 && x !== 40);

    // there can be at most one familiar
    if (familiars.length > 1) {
        return false;
    }

    let values = not_familiars.map(x => x % 13);
    // 0 == 13
    values = values.map(x => {
        if (x == 0) {
            return 13;
        }
        return x;
    });

    // then we can play two or more cards
    // if they are the same
    // and their sum is equal or less than 10
    let sum = values.reduce((a, b) => a + b, 0);
    if (sum > 10) {
        return false;
    }

    const all_equals = values.every(v => v === values[0]);

    return all_equals;
}

function getCardSeed(cardId) {
    if (cardId >= 1 && cardId <= 13) {
        return 'clubs';
    }
    if (cardId >= 14 && cardId <= 26) {
        return 'diamonds';
    }
    if (cardId >= 27 && cardId <= 39) {
        return 'hearts';
    }
    if (cardId >= 40 && cardId <= 52) {
        return 'spades';
    }
    if (cardId === 53 || cardId === 54) {
        return 'jester';
    }
    return 'unknown';
}

function getCardKind(cardId) {
    if (cardId == 0) {
        return 'unknown';
    }

    if (cardId == 53 || cardId === 54) {
        return '*';
    }

    let value = cardId % 13;

    if (value == 0) {
        return 'K';
    }
    if (value == 12) {
        return 'Q';
    }
    if (value == 11) {
        return 'J';
    }

    return value.toString();
}

function getMonsterMaxHp(cardId) {
    let kind = getCardKind(cardId);
    if (kind == 'J') {
        return 20;
    }
    if (kind == 'Q') {
        return 30;
    }
    if (kind == 'K') {
        return 40;
    }
    return 0;
}

function getCardAttackValue(cardId) {
    if (cardId == 0) {
        return 0;
    }
    if (cardId == 53 || cardId == 54) {
        return 0;
    }

    let value = cardId % 13;

    if (value == 0) {
        return 20;
    }
    if (value == 12) {
        return 15;
    }
    if (value == 11) {
        return 10;
    }
    return value;
}

function getCardsAttackValue(cards) {
    return cards.reduce((a, b) => getCardAttackValue(a) + getCardAttackValue(b), 0);
}

/*
function sameSeed(cardA, cardB) {
    return getCardSeed(cardA) === getCardSeed(cardB);
}*/

function buildCastleDeck() {
    let jacks = shuffle.knuthShuffle(JACKS.slice(0));
    let queens = shuffle.knuthShuffle(QUEENS.slice(0));
    let kings = shuffle.knuthShuffle(KINGS.slice(0));

    return kings.concat(queens, jacks);
}

function buildTavernDeck(playersCount) {
    let my_deck = [];

    // add clubs 1-10
    for (let i = 1; i <= 10; i++) {
        my_deck.push(i);
    }

    // add diamonds 1-10
    for (let i = 14; i <= 23; i++) {
        my_deck.push(i);
    }

    // add hearts 1-10
    for (let i = 27; i <= 36; i++) {
        my_deck.push(i);
    }

    // add spades 1-10
    for (let i = 40; i <= 49; i++) {
        my_deck.push(i);
    }

    // 4 players: add two jesters
    // 3 players: add one jesters
    // 2 players: add no jesters
    if (playersCount > 2) {
        my_deck.push(53);
    }
    if (playersCount > 3) {
        my_deck.push(54);
    }

    return shuffle.knuthShuffle(my_deck.slice(0));
}

function hasCardSeed(cards, seed) {
    return cards.some(x => getCardSeed(x) == seed);
}
//
class RoomInfo {
    constructor(name) {
        this.name = name;
        this.isAvailable = true;        
    }

    static fromRoom(theRoom) {
        let info = new RoomInfo(theRoom.name);
        info.isAvailable = !theRoom.isFull() && !theRoom.isStarted();
        return info;
    }
}

class Room {
    constructor(name) {
        this.name = name;
        this.players = [];
        this.game_info = new GameInfo();
        this.deck = [];
        this.discard_pile = [];
        this.castle_deck = [];
    }

    isFull() {
        return this.players.length >= 4;
    }

    isStarted() {
        return this.game_info.started;
    }    

    resetGameInfo() {
        this.game_info = new GameInfo();
        this.game_info.tavern_deck_size = this.deck.length;
        this.game_info.castle_deck_size = this.castle_deck.size;
        this.game_info.discard_pile_size = 0;
        this.game_info.started = false;

        // also needs to reset player hands
        this.players.forEach(x => {
            x.playerHand = [];
        });
    }

    setCurrentPlayer(playerId) {
        this.game_info.current_player_id = playerId;
    }

    startGame() {
        this.game_info.started = true;
    }

    sendCardShuffle() {
        io.to(this.name).emit('shuffleCards');
        logger.debug('E: shuffleCards');
    }

    sendGameInfo() {
        this.game_info.castle_deck_size = this.castle_deck.length;
        this.game_info.tavern_deck_size = this.deck.length;
        this.game_info.discard_pile_size = this.discard_pile.length;

        io.to(this.name).emit('gameInfo', this.game_info, this.players);
        logger.debug('E: gameInfo -- gameInfo: %o, players: %o', this.game_info, this.players);
    }

    sendGameOver(victory) {
        this.game_info.started = false;
        io.to(this.name).emit('gameOver', victory);
        logger.debug('E: gameOver -- %o', victory);
    }

    nextMonster() {
        // set the current monster
        this.game_info.current_monster = this.castle_deck.pop();
        this.game_info.current_monster_hp = getMonsterMaxHp(this.game_info.current_monster);
        this.game_info.potential_shield = 0;
        this.game_info.current_shield = 0;
        this.game_info.current_inflicted_damage = 0;
        this.game_info.current_monster_attack = getCardAttackValue(this.game_info.current_monster);
    }


    logCurrentMonsterStatus() {
        let card_kind = getCardKind(this.game_info.current_monster);
        let card_seed = getCardSeed(this.game_info.current_monster);
        logger.info('current monster is: %s of %s', card_kind, card_seed);
        logger.info('current HP: %d of %d', (this.game_info.current_monster_hp - this.game_info.current_inflicted_damage), this.game_info.current_monster_hp);
        logger.debug('attack damage: %d', getCardAttackValue(this.game_info.current_monster));
    }

    nextPlayer() {
        let player = this.players.find(x => x.playerId === this.game_info.current_player_id);
        logger.debug('current player id: %s', this.game_info.current_player_id);
        let playerIdx = this.players.indexOf(player);
        logger.debug('found at index: %d', playerIdx);
        let nextIndex = (playerIdx + 1) % this.players.length;
        logger.debug('next index: %d', nextIndex);
        let next = this.players[nextIndex];
        this.setCurrentPlayer(next.playerId);
        logger.debug('next player id: %s', this.game_info.current_player_id);
    }

    getMaxHandSize() {
        return MAX_HAND_SIZES[this.players.length];
    }

    removePlayer(playerId) {
        this.players = this.players.filter(player => player.playerId !== playerId);
        io.to(this.name).emit('playerLeave', playerId);
        logger.debug('E: playerLeave -- room: %s, player: %s', this.name, playerId);        
    }

    addPlayer(player) {
        this.players.push(player);
        io.to(this.name).emit('playerJoin', player.playerId, player.playerName, this.players);
        logger.debug('E: playerJoin -- id: %s, name: %s, players: %o', player.playerId, player.playerName, this.players);
    }
}

const ROOMS = [new Room('ROOM1'), new Room('ROOM2'), new Room('ROOM3'), new Room('ROOM4')]
const DEFAULT_ROOM = new Room('DEFAULT');

function getFreeRoom() {
    let freeRooms = ROOMS.filter(x => !x.isFull() && !x.isStarted());
    if (freeRooms.length == 0)
        return null;
    return freeRooms[0];
}

function joinTheRoom(socket, player, roomName) {
    let new_room = ROOMS.find(x=>x.name===roomName);
    if (!new_room || new_room.isFull() || new_room.isStarted())
        return false;

    // check if the player is in another room
    let old_room = ROOMS.find(x=>x.players.indexOf(player) >= 0);

    if (old_room) {

        if (new_room.name == old_room.name) {
            return false;
        }

        // leave room
        socket.leave(old_room.name);
        old_room.removePlayer(player.playerId);
    }
    // then join the new room
    new_room = ROOMS.find(x=>x.name===roomName);
    if (new_room) {
        socket.join(new_room.name);
        new_room.addPlayer(player);        
    }
    return true;
}

function getDefaultRoom() {
    return DEFAULT_ROOM;
}

io.on('connection', function (socket) {
    logger.debug('A user connected: %s', socket.id);

    let room = getDefaultRoom();
    
    /*
    const room = getFreeRoom();
    if (room === null) {
        logger.debug('connection refused!');
        socket.disconnect(true);
        return;
    }

    socket.join(room);
    logger.debug('room %s players.length: %d', room.name, (room.players.length + 1));
    */

    socket.join(room);
    logger.debug('Player entering the default room.');

    // e.g. BigRedDonkey
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        style: 'capital',
        separator: ''
    });

    let player = new Player(socket.id, uniqueName);
    //room.players.push(player);

    socket.on('roomInfo', function () {
        logger.debug('R: roomInfo -- id: %s', socket.id);
        // emit the available rooms
        const roomsInfo = ROOMS.map(x=>RoomInfo.fromRoom(x));
        io.to(socket.id).emit('roomInfo', roomsInfo);
        logger.debug('E: roomInfo -- rooms: %o', roomsInfo);
    });

    socket.on('playerJoin', function(roomName) {
        logger.debug('R: playerJoin -- id: %s, roomName: %s', socket.id, roomName);
        
        if (joinTheRoom(socket, player, roomName)) {
            // change room
            room = ROOMS.find(x=>x.name===roomName);
        }
    });

    /*
    socket.on('playerJoin', function () {
        logger.debug('R: playerJoin -- id: %s', socket.id);
        io.to(room.name).emit('playerJoin', socket.id, uniqueName, room.players);
        logger.debug('E: playerJoin -- id: %s, name: %s, players: %o', socket.id, uniqueName, room.players);
    });
    */

    socket.on('playerReady', function (isReady) {
        logger.debug('R: playerReady -- id: %s, ready: %o', socket.id, isReady);
        io.to(room.name).emit('playerReady', socket.id, isReady);
        logger.debug('E: playerReady -- id: %s, ready: %o', socket.id, isReady);

        room.players.find(x => x.playerId == socket.id).ready = isReady;

        // check if every player is ready
        const readyNess = room.players.map(x => x.ready);
        const allReady = readyNess.every(v => v === readyNess[0]);
        const canStart = allReady && room.players.length >= 2;

        io.to(room.name).emit('canStartGame', canStart);
        logger.debug('E: canStartGame: %o', canStart);
    });

    socket.on('startGame', function () {
        logger.debug('R: startGame');
        io.to(room.name).emit('startGame', room.name);
        logger.debug('E: startGame. Room: %s', room.name);
    });

    socket.on('nextPlayer', function (nextPlayerId) {        
        logger.debug('R: nextPlayer -- playerId: %s', nextPlayerId);
        room.setCurrentPlayer(nextPlayerId);
        room.sendGameInfo();        
    });    

    socket.on('gameOver', function () {
        logger.debug('R: gameOver');

        if (room.game_info.started) {
            room.sendGameOver();
            room.resetGameInfo();
            room.sendGameInfo();
        } else {
            logger.warn('(gameOver) Ignored because game is not started yet.');
        }
    });

    socket.on('gameInfo', function () {
        io.to(socket.id).emit('gameInfo', room.game_info, room.players);
        logger.debug('E: gameInfo (requested) -- playerId: %s, gameInfo: %o, players: %o', socket.id, room.game_info, room.players);
    });

    socket.on('dealCards', function (playerId) {
        logger.debug('R: dealCards');

        if (room.game_info.started) {
            logger.warn("(dealCards) Ignored because game is already started");
            room.sendGameInfo();
            return;
        }

        room.resetGameInfo();

        // someone requested to deal the cards
        // first of all we shuffle the deck
        room.sendCardShuffle();

        room.deck = buildTavernDeck(room.players.length);
        logger.debug('tavern deck. %d cards, %o', room.deck.length, room.deck);

        room.castle_deck = buildCastleDeck();
        logger.debug('castle deck. %d cards, %o', room.castle_deck.length, room.castle_deck);

        room.discard_pile = [];

        // then for each player we deal the appropriate number of cards
        room.players.forEach(x => {
            let hand = []
            for (let i = 0; i < room.getMaxHandSize(); i++)
                hand.push(room.deck.pop());
            x.playerHand = hand;

            logger.debug('Dealing %o to player %s', x.playerHand, x.playerId);
        });

        room.setCurrentPlayer(playerId);
        room.startGame();

        // set the current monster
        room.nextMonster();
        room.logCurrentMonsterStatus();

        room.sendGameInfo();
    });

    socket.on('cardPlayed', function (cards, playerId) {

        logger.debug('R: cardPlayed. cards %o, playerId: %s', cards, playerId);

        if (playerId != room.game_info.current_player_id) {
            logger.warn('(cardPlayed) discard card since not from current player');
            room.sendGameInfo();
            return;
        }

        let player = room.players.find(x => x.playerId === playerId);
        if (player === undefined) {
            logger.error('player not found -- id: %s, players: %o', playerId, room.players);
            room.sendGameInfo();
            return;
        }

        // check if the player is discarding cards due to damage
        if (room.game_info.current_player_damage > 0) {
            const card_value = getCardsAttackValue(cards);
            room.game_info.current_player_damage = Math.max(0, room.game_info.current_player_damage - card_value);

            cards.forEach(cardId => {
                player.playerHand = player.playerHand.filter(x => x !== cardId);
                room.discard_pile.push(cardId);
            });

            io.to(playerId).emit('cardsDiscarded', cards, playerId);
            logger.debug('E: cardsDiscarded. playerId: %s, cards: %o', playerId, cards);

            if (room.game_info.current_player_damage <= 0) {
                logger.info("Player dealt with the damage, next turn...");
                room.nextPlayer();
                room.sendGameInfo();
            } else if (player.playerHand.length == 0) {
                logger.info("Player cannot deal with the damage, game over!");
                room.sendGameOver(false);
                room.resetGameInfo();
            } else {
                logger.info("Player need to discard cards -- damage left: %d", room.game_info.current_player_damage);
                room.sendGameInfo();
            }
            return;
        }

        if (!isValidPlay(cards)) {
            // reject played cards
            logger.warn('(cardPlayed) ignored card since this is not a valid play/combo. cards: %o', cards);
            room.sendGameInfo();
            return;
        }

        // STEP 1 (play a card)
        // when a card is played
        // is removed from the hand of the player
        // and added to the board
        cards.forEach(cardId => {
            player.playerHand = player.playerHand.filter(x => x !== cardId);
            room.game_info.board.push(cardId);

            // we tell the client that a card was played
            io.to(room.name).emit('cardPlayed', cardId, playerId);
            logger.debug('E: cardPlayed -- cardId: %s, playerId: %s', cardId, playerId);
        });

        if (hasCardSeed(cards, 'jester')) {

            logger.info('Played a jester, which disables enemy immunity');

            // remove immunity
            room.game_info.monster_has_immunity = false;

            // apply potential shield
            room.game_info.current_shield = room.game_info.potential_shield;
            
            // TODO. the played will need to choose the next player
            // for the moment we choose a random player

            //let [nextPlayerId] = shuffle.knuthShuffle(room.players.map(x => x.playerId).slice(0));
            //room.setCurrentPlayer(nextPlayerId);
            //room.sendGameInfo();

            // ask the current player to choose the next
            io.to(socket.id).emit('nextPlayer');
            logger.debug('E: nextPlayer');            
            return;
        }

        let double_damage = false;
        let apply_shield = false;

        let seeds = cards.map(x => getCardSeed(x));
        // remove duplicates
        seeds = seeds.filter((v, i, a) => a.indexOf(v) === i);

        if (cards.length > 1) {
            logger.debug('Played %d cards combo. seeds: %o', cards.length, seeds);
        }

        seeds.forEach(seed => {

            // STEP 2 (activate power)
            // if monster has immunity to that seed
            // no effect is applied

            if (seed === 'spades') {
                room.game_info.potential_shield += getCardsAttackValue(cards);
                logger.info('Potential shield: %d', room.game_info.potential_shield);
            }

            if ((getCardSeed(room.game_info.current_monster) != seed) || !room.game_info.monster_has_immunity) {
                // we apply the effect of the card
                // diamonds and hearts are applied immediately
                if (seed === 'hearts') {
                    logger.info('Played hearts card, put cards from discard pile at the bottom of the tavern deck.');

                    const card_value = getCardsAttackValue(cards);
                    logger.debug('Card(s) value: %d', card_value);

                    logger.debug('Discard pile (before): %o', room.discard_pile);
                    logger.debug('Tavern deck (before): %o', room.discard_pile);

                    // shuffle discard pile
                    room.discard_pile = shuffle.knuthShuffle(room.discard_pile.slice(0));

                    const cards_to_move = Math.min(room.discard_pile.length, card_value);
                    logger.info('Moving %d cards from discard pile to tavern deck...');

                    // put cards from the discard pile on the bottom of the deck
                    for (let i = 0; i < cards_to_move; i++) {
                        room.deck.unshift(room.discard_pile.pop());
                    }

                    logger.debug('Discard pile (after): %o', room.discard_pile);
                    logger.debug('Tavern deck (after): %o', room.discard_pile);

                } else if (seed === 'diamonds') {
                    logger.info('Played diamonds card, draw cards from tavern deck.');

                    // draw cards from tavern deck and put in players hands.
                    const playerHands = room.players.map(x => x.playerHand.length);
                    const playerCards = playerHands.reduce((a, b) => a + b, 0);
                    const maxPlayerCards = room.players.length * room.getMaxHandSize();
                    const maxDrawnCards = maxPlayerCards - playerCards;

                    let drawn_cards = [];
                    const card_value = getCardsAttackValue(cards);
                    let draw_card_num = Math.min(card_value, maxDrawnCards);
                    draw_card_num = Math.min(draw_card_num, room.deck.length);

                    logger.debug('Card value: %d', card_value);
                    logger.debug('maxDrawnCards %d', maxDrawnCards);
                    logger.debug('Tavern deck size %d', room.deck.length);

                    logger.info('Drawing %d cards from tavern deck...', draw_card_num);

                    for (let i = 0; i < draw_card_num; i++) {
                        drawn_cards.push(room.deck.pop());
                    }

                    logger.info('Drawn cards: %o', drawn_cards);
                    logger.info('Dealing those cards to players...');

                    while (true) {
                        // no more card to draw
                        if (drawn_cards.length <= 0) {
                            break;
                        }

                        let availablePlayers = room.players.filter(x => x.playerHand.length < room.getMaxHandSize());
                        if (availablePlayers.length == 0) {
                            break;
                        }

                        for (let i = 0; i < availablePlayers.length; i++) {
                            if (drawn_cards.length <= 0) {
                                break;
                            }

                            let card = drawn_cards.pop();
                            availablePlayers[i].playerHand.push(card);

                            // we tell the client that a card was draw
                            io.to(playerId).emit('cardDraw', card, playerId);
                            logger.debug('E: cardDraw -- cardId: %s, playerId: %s', card, playerId);
                        }
                    }

                    logger.debug('Drawn cards (after): %o', drawn_cards);

                } else if (seed === 'clubs') {
                    logger.info('Played clubs card, double damage!!!');
                    double_damage = true;
                } else if (seed === 'spades') {
                    logger.info('Played spades card, shields up!!!');
                    apply_shield = true;
                }
            } else {
                logger.debug('The enemy is immune to %s effects!', seed);
            }
        });

        // STEP 3 deal damage and check if monster is defeated
        let card_damage = getCardsAttackValue(cards);
        if (double_damage) {
            card_damage *= 2;
        }
        room.game_info.current_inflicted_damage += card_damage;

        logger.info(
            'Inflicted %d damage to enemy. Total damage: %d. Hp left: %d',
            card_damage,
            room.game_info.current_inflicted_damage,
            (room.game_info.current_monster_hp - room.game_info.current_inflicted_damage)
        );

        // is monster dead?
        if (room.game_info.current_inflicted_damage >= room.game_info.current_monster_hp) {
            if (room.game_info.current_inflicted_damage === room.game_info.current_monster_hp) {
                // exact kill!!! place it on top of deck
                room.deck.push(room.game_info.current_monster);
                logger.info('Exact kill! Enemy card was placed face down on top of tavern deck!');
            } else {
                // overkill
                room.discard_pile.push(room.game_info.current_monster);
                logger.info('Enemy down! Enemy card was placed in the discard pile!');
            }

            // discard the whole board
            logger.debug('Discard the current board: %o', room.game_info.board);
            while (room.game_info.board.length > 0) {
                room.discard_pile.push(room.game_info.board.pop());
            }
            logger.debug('Board (after): %o, Discard pile: %o', room.game_info.board, room.discard_pile);

            if (room.castle_deck.length === 0) {
                logger.info("All enemy are dead. YOU WIN!");
                // YOU WIN!!!
                room.sendGameOver(true);
                room.resetGameInfo();
            } else {
                logger.info("Proceed with next enemy.");
                room.nextMonster();
                room.sendGameInfo();
            }

            return;
        }

        // STEP 4 suffer damage
        let damage_suffered = getCardAttackValue(room.game_info.current_monster);

        if (apply_shield) {
            room.game_info.current_shield = room.game_info.potential_shield;
        }

        damage_suffered = Math.max(0, damage_suffered - room.game_info.current_shield);

        if (damage_suffered == 0) {
            logger.info("Player sustained no damage.");
            room.nextPlayer();
        } else {
            logger.info("Player was hit per %d damage.", damage_suffered);
            room.game_info.current_player_damage = damage_suffered;
            //io.emit('sufferDamage', playerId, damage_suffered);
        }

        room.sendGameInfo();
    });

    socket.on('disconnecting', function () {
        logger.debug('User disconnecting -- id: %s, user rooms: %o', socket.id, socket.rooms);

        room.players = room.players.filter(player => player.playerId !== socket.id);
        logger.debug('Player room: %s left with %d players', room.name, room.players.length);

        // send game over
        room.sendGameOver(false);
        room.resetGameInfo();
    });

    socket.on('disconnect', function () {
        logger.debug('A user disconnected -- id: %s' + socket.id);
    });
});

// serve static files
server.use(express.static(path.join(__dirname, './client/dist')));

http.listen(PORT, function () {
    console.log('Listening on port %d', http.address().port);
    logger.debug('Listening on port %d', http.address().port);
});
