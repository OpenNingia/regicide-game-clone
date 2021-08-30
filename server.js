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
// const { runInThisContext } = require('vm');

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
    values = values.map(x => {
        if ( x == 0 ) {
            return 13;
        }
        return x;
    });

    // then we can play two or more cards
    // if they are the same
    // and their sum is equal or less than 10
    let sum = values.reduce((a, b) => a + b, 0);
    if ( sum > 10 ) {
        return false;
    }

    const all_equals = values.every( v => v === values[0] );

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
        return 'jolly';
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

function buildTavernDeck() {
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

    // add the two jolly
    my_deck.push(53);
    my_deck.push(54);

    return shuffle.knuthShuffle(my_deck.slice(0));
}


function hasCardSeed(cards, seed) {
    return cards.some(x=>getCardSeed(x) == seed);
}

//

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

    sendPlayerHands() {
        // TODO. private messages
        io.to(this.name).emit('dealCards', this.players);
        console.log('E: dealCards', this.players);
    }

    sendCardShuffle() {
        io.to(this.name).emit('shuffleCards');
        console.log('E: shuffleCards');
    }    

    sendGameInfo() {
        this.game_info.castle_deck_size = this.castle_deck.length;
        this.game_info.tavern_deck_size = this.deck.length;
        this.game_info.discard_pile_size = this.discard_pile.length;

        io.to(this.name).emit('gameInfo', this.game_info, this.players);
        console.log('E: gameInfo', this.game_info, this.players);
    }

    sendGameOver(victory) {
        this.game_info.started = false;
        io.to(this.name).emit('gameOver', victory);
        console.log('E: gameOver', victory);
    }

    nextMonster() {
        // set the current monster
        this.game_info.current_monster = this.castle_deck.pop();
        this.game_info.current_monster_hp = getMonsterMaxHp(this.game_info.current_monster);
        this.game_info.current_shield = 0;
        this.game_info.current_inflicted_damage = 0;
        this.game_info.current_monster_attack = getCardAttackValue(this.game_info.current_monster);
    }


    logCurrentMonsterStatus() {
        let card_kind = getCardKind(this.game_info.current_monster);
        let card_seed = getCardSeed(this.game_info.current_monster);
        console.log('current monster is: ' + card_kind + ' of ' + card_seed);
        console.log('current HP: ' + (this.game_info.current_monster_hp-this.game_info.current_inflicted_damage) + ' of ' + this.game_info.current_monster_hp);
        console.log('attack damage: ' + getCardAttackValue(this.game_info.current_monster));
    }

    nextPlayer() {
        let player = this.players.find(x=>x.playerId===this.game_info.current_player_id);
        console.log(`current player id: ${this.game_info.current_player_id}`);
        let playerIdx = this.players.indexOf(player);
        console.log(`found at index: ${playerIdx}`);
        let nextIndex = (playerIdx+1) % this.players.length;
        console.log(`next index: ${nextIndex}`);
        let next = this.players[nextIndex];
        this.setCurrentPlayer(next.playerId);
        console.log(`next player id: ${this.game_info.current_player_id}`);
    }

    getMaxHandSize() {
        return MAX_HAND_SIZES[this.players.length];
    }
}

const ROOMS = [new Room('ROOM1'), new Room('ROOM2'), new Room('ROOM3'), new Room('ROOM4')]

function getFreeRoom() {
    let freeRooms = ROOMS.filter(x=>!x.isFull());
    if (freeRooms.length == 0)
        return null;
    return freeRooms[0];
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    const room = getFreeRoom();
    if ( room === null ) {
        console.log('connection refused!');
        socket.disconnect(true);
        return;
    }

    socket.join(room.name);
    console.log(`room ${room.name} players.length: ${(room.players.length + 1)}`);

    // e.g. BigRedDonkey
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        style: 'capital',
        separator: ''
    });

    let player = new Player(socket.id, uniqueName);
    room.players.push(player);

    socket.on('playerJoin', function () {
        io.to(room.name).emit('playerJoin', socket.id, uniqueName, room.players);
        console.log('E: playerJoin', socket.id, uniqueName, room.players);

        /*if (room.isFull()) {
            io.to(room.name).emit('roomFull', room.name);
            console.log('E: roomFull', room.name);
        }*/
    });

    socket.on('playerReady', function (isReady) {
        io.to(room.name).emit('playerReady', socket.id, isReady);
        console.log('E: playerReady', socket.id, isReady);

        room.players.find(x=>x.playerId==socket.id).ready = isReady;

        // check if every player is ready
        const readyNess = room.players.map(x=>x.ready);
        const allReady = readyNess.every( v => v === readyNess[0] );
        const canStart = allReady && room.players.length >= 2;

        io.to(room.name).emit('canStartGame', canStart);
        console.log('E: canStartGame', canStart);
    });

    socket.on('startGame', function () {
        io.to(room.name).emit('startGame', room.name);
        console.log('E: startGame', room.name);        
    });

    socket.on('playerReady', function (isReady) {
        io.to(room.name).emit('playerReady', socket.id, isReady);
        console.log('E: playerReady', socket.id, isReady);

        room.players.find(x=>x.playerId==socket.id).ready = isReady;

        // check if every player is ready
        const readyNess = room.players.map(x=>x.ready);
        const allReady = readyNess.every( v => v === readyNess[0] );
        const canStart = allReady && room.players.length >= 2;

        io.to(room.name).emit('canStartGame', canStart);
        console.log('E: canStartGame', canStart);
    });    

    socket.on('gameOver', function () {
        console.log('R: gameOver');

        if (room.game_info.started) {
            room.sendGameOver();
            room.resetGameInfo();
            room.sendGameInfo();
        } else {
            console.log('Ignored because game is not started yet.');
        }        
    });

    socket.on('gameInfo', function () {
        io.to(socket.id).emit('gameInfo', room.game_info, room.players);
        console.log('E: gameInfo (requested)', socket.id, room.game_info, room.players);
    });

    socket.on('dealCards', function (playerId) {
        console.log('R: dealCards');

        if (room.game_info.started) {
            console.log("Ignored because game is already started");
            room.sendGameInfo();
            return;
        }

        room.resetGameInfo();

        // someone requested to deal the cards
        // first of all we shuffle the deck
        room.sendCardShuffle();

        room.deck = buildTavernDeck();
        console.log('tavern deck: ', room.deck);

        room.castle_deck = buildCastleDeck();
        console.log('castle deck: ', room.castle_deck);        

        // then for each player we deal the appropriate number of cards
        room.players.forEach(x => {
            let hand = []
            for (let i = 0; i < room.getMaxHandSize(); i++)
                hand.push(room.deck.pop());
            x.playerHand = hand;
        });
        
        room.setCurrentPlayer(playerId);
        room.startGame();

        // set the current monster
        room.nextMonster();
        room.logCurrentMonsterStatus();

        room.sendGameInfo();
    });

    socket.on('cardPlayed', function (cards, playerId) {

        console.log('R: cardPlayed', cards, playerId);

        if (playerId != room.game_info.current_player_id) {
            console.log('discard card since not from current player');
            room.sendGameInfo();
            return;
        }

        let player = room.players.find(x => x.playerId === playerId);
        if (player === undefined) {
            console.log('player not found', playerId, room.players);
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
            console.log('E: cardsDiscarded', cards, playerId);

            //room.sendPlayerHands();

            if ( room.game_info.current_player_damage <= 0 ) {
                console.log("player soaked all the damage, next turn...");
                room.nextPlayer();
                room.sendGameInfo();
            } else if (player.playerHand.length == 0) {
                room.sendGameOver(false);
                room.resetGameInfo();
            } else {
                room.sendGameInfo();
            }
            return;
        }

        if (!isValidPlay(cards)) {
            // reject played cards
            console.log('discard card since this is not a valid play/combo');
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
            console.log('E: cardPlayed', cardId, playerId);
        });

        //room.sendPlayerHands();

        if (hasCardSeed(cards, 'jolly')) {

            console.log('Played a jolly, disabling enemy immunity');

            // remove immunity
            room.game_info.monster_has_immunity = false;
            // TODO. the played will need to choose the next player
            // for the moment we choose a random player

            let [nextPlayerId] = shuffle.knuthShuffle(room.players.map(x=>x.playerId).slice(0));
            room.setCurrentPlayer(nextPlayerId);
            room.sendGameInfo();
            return;
        }

        let double_damage = false;
        let apply_shield = false;

        let seeds = cards.map(x=>getCardSeed(x));
        // remove duplicates
        seeds = seeds.filter((v, i, a) => a.indexOf(v) === i);

        if (cards.length > 1) {
            console.log(`played ${cards.length} combo. seeds: ${seeds}`);
        }

        seeds.forEach(seed => {

            // STEP 2 (activate power)
            // if monster has immunity to that seed
            // no effect is applied
            if ((getCardSeed(room.game_info.current_monster) != seed) || !room.game_info.monster_has_immunity) {
                // we apply the effect of the card
                // diamonds and hearts are applied immediately
                if (seed == 'hearts') {
                    console.log('played hearts card, put cards from discard pile at the bottom of the tavern deck.');

                    const card_value = getCardsAttackValue(cards);
                    console.log('card(s) value: ', card_value);

                    // shuffle discard pile
                    room.discard_pile = shuffle.knuthShuffle(room.discard_pile.slice(0));

                    // put cards from the discard pile on the bottom of the deck
                    for (let i = 0; i < card_value; i++) {
                        if (room.discard_pile.length > 0) {
                            room.deck.unshift(room.discard_pile.pop());
                        } else {
                            break;
                        }
                    }
                } else if (seed == 'diamonds') {
                    console.log('played diamonds card, draw cards from tavern deck.');

                    // draw cards from tavern deck and put in players hands.
                    const playerHands = room.players.map(x=>x.playerHand.length);
                    const playerCards = playerHands.reduce((a, b) => a+b, 0);
                    const maxPlayerCards = room.players.length * room.getMaxHandSize();
                    const maxDrawnCards = maxPlayerCards - playerCards;

                    let drawn_cards = [];
                    const card_value = getCardsAttackValue(cards);
                    let draw_card_num = Math.min(card_value, maxDrawnCards);
                    draw_card_num = Math.min(draw_card_num, room.deck.length);

                    console.log('card value', card_value);
                    console.log('maxDrawnCards', maxDrawnCards);
                    console.log('tavern deck size', room.deck.length);
                    console.log('draw_card_num', draw_card_num);

                    for (let i = 0; i < draw_card_num; i++) {
                        drawn_cards.push(room.deck.pop());
                    }

                    console.log('drawn cards:', drawn_cards);

                    while(true) {
                        // no more card to draw
                        if (drawn_cards.length <= 0) {
                            break;
                        }

                        let availablePlayers = room.players.filter(x=>x.playerHand.length < room.getMaxHandSize());
                        if (availablePlayers.length == 0) {
                            break;
                        }

                        for(let i = 0; i < availablePlayers.length; i++) {
                            if (drawn_cards.length <= 0) {
                                break;
                            }

                            let card = drawn_cards.pop();
                            availablePlayers[i].playerHand.push(card);

                            // we tell the client that a card was draw
                            io.to(playerId).emit('cardDraw', card, playerId);
                            console.log('E: cardDraw', card, playerId);
                        }
                    }

                    console.log('drawn cards:', drawn_cards);

                    // room.sendPlayerHands();

                } else if (seed == 'clubs') {
                    console.log('played clubs card, double damage!!!');
                    double_damage = true;
                } else if (seed == 'spades') {
                    console.log('played clubs card, shields up!');
                    apply_shield = true;
                }
            } else {
                console.log(`The enemy is immune to "${seed}" effects!`);
            }
        });

        // STEP 3 deal damage and check if monster is defeated
        let card_damage = getCardsAttackValue(cards);
        if (double_damage) {
            card_damage *= 2;
        }
        room.game_info.current_inflicted_damage += card_damage;

        console.log('inflicted damage to enemy.', card_damage);
        console.log('inflicted damage to enemy. Total damage: ', room.game_info.current_inflicted_damage);
        console.log('enemy hp remaining: ', (room.game_info.current_monster_hp-room.game_info.current_inflicted_damage));

        // is monster dead?
        if (room.game_info.current_inflicted_damage >= room.game_info.current_monster_hp) {
            if (room.game_info.current_inflicted_damage === room.game_info.current_monster_hp) {
                // exact kill!!! place it on top of deck
                room.deck.push(room.game_info.current_monster);
                console.log('Exact kill! Enemy card was placed face down on top of tavern deck!');
            } else {
                // overkill
                room.discard_pile.push(room.game_info.current_monster);
                console.log('Enemy down! Enemy card was placed in the discard pile!');
            }

            // discard the whole board
            while(room.game_info.board.length > 0) {
                room.discard_pile.push(room.game_info.board.pop());
                console.log('board', room.game_info.board);
                console.log('discard pile', room.discard_pile);
            }

            if ( room.castle_deck.length === 0 ) {
                // YOU WIN!!!
                room.sendGameOver(true);              
                room.resetGameInfo();
            } else {
                room.nextMonster();
                room.sendGameInfo();
            }

            return;
        }

        // STEP 4 suffer damage
        let damage_suffered = getCardAttackValue(room.game_info.current_monster);
        if (apply_shield) {
            room.game_info.current_shield += getCardsAttackValue(cards);
        }

        damage_suffered = Math.max(0, damage_suffered - room.game_info.current_shield);

        console.log("player should suffer damage: ", damage_suffered);

        if ( damage_suffered == 0 ) {
            room.nextPlayer();
        } else {
            room.game_info.current_player_damage = damage_suffered;
            //io.emit('sufferDamage', playerId, damage_suffered);
        }

        room.sendGameInfo();
    });

    socket.on('disconnecting', function () {
        console.log('User disconnecting: ', socket.id);
        console.log('It was on rooms: ', socket.rooms);

        room.players = room.players.filter(player => player.playerId !== socket.id);
        console.log(`room ${room.name} players.length: ${room.players.length}`);
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
    });
});

// serve static files
server.use(express.static(path.join(__dirname, './client/dist')));

http.listen(PORT, function () {
    console.log('Listening on port ', http.address().port);
});

