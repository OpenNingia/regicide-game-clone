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
const { runInThisContext } = require('vm');

let players = [];
let deck = [];
let discard_pile = [];
let castle_deck = [];
let game_info = null;

const CARDS_TO_DEAL = 5;

const JACKS = [11, 24, 37, 50];
const QUEENS = [12, 25, 38, 51];
const KINGS = [13, 26, 39, 52];

class Player {
    constructor(playerId, playerName) {

        this.playerId = playerId;
        this.playerName = playerName;
        this.playerHand = [];
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
        this.board = [];
    }
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

function sameSeed(cardA, cardB) {
    return getCardSeed(cardA) === getCardSeed(cardB);
}

function buildCastleDeck() {
    let jacks = shuffle.knuthShuffle(JACKS.slice(0));
    let queens = shuffle.knuthShuffle(QUEENS.slice(0));
    let kings = shuffle.knuthShuffle(KINGS.slice(0));

    return kings.concat(queens, jacks);
}

function buildTavernDeck() {
    my_deck = [];

    // add clubs 1-10
    for (i = 1; i <= 10; i++) {
        my_deck.push(i);
    }

    // add diamonds 1-10
    for (i = 14; i <= 23; i++) {
        my_deck.push(i);
    }

    // add hearts 1-10
    for (i = 27; i <= 36; i++) {
        my_deck.push(i);
    }

    // add spades 1-10
    for (i = 40; i <= 49; i++) {
        my_deck.push(i);
    }

    // add the two jolly
    my_deck.push(53);
    my_deck.push(54);

    return shuffle.knuthShuffle(my_deck.slice(0));
}

function nextMonster() {
    // set the current monster
    game_info.current_monster = castle_deck.pop();
    game_info.current_monster_hp = getMonsterMaxHp(game_info.current_monster);
    game_info.current_shield = 0;
    game_info.current_inflicted_damage = 0;
    game_info.current_monster_attack = getCardAttackValue(game_info.current_monster);
}

function logCurrentMonsterStatus() {
    let card_kind = getCardKind(game_info.current_monster);
    let card_seed = getCardSeed(game_info.current_monster);
    console.log('current monster is: ' + card_kind + ' of ' + card_seed);
    console.log('current HP: ' + (game_info.current_monster_hp-game_info.current_inflicted_damage) + ' of ' + game_info.current_monster_hp);
    console.log('attack damage: ' + getCardAttackValue(game_info.current_monster));
}

function sendPlayerHands() {
    io.emit('dealCards', players);
    console.log('E: dealCards', players);
}

function sendGameInfo() {
    game_info.castle_deck_size = castle_deck.length;
    game_info.tavern_deck_size = deck.length;
    game_info.discard_pile_size = discard_pile.length;

    io.emit('gameInfo', game_info);
    console.log('E: gameInfo', game_info);
}

function nextPlayer() {
    let player = players.find(x=>x.playerId===game_info.current_player_id);
    console.log(`current player id: ${game_info.current_player_id}`);
    let playerIdx = players.indexOf(player);
    console.log(`found at index: ${playerIdx}`);
    let nextIndex = (playerIdx+1) % players.length;
    console.log(`next index: ${nextIndex}`);
    let next = players[nextIndex];
    game_info.current_player_id = next.playerId;
    console.log(`next player id: ${game_info.current_player_id}`);
}

function hasCardSeed(cards, seed) {
    return cards.some(x=>getCardSeed(x) == seed);
}

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    console.log('players.length: ' + (players.length + 1));

    if (players.length >= 4) {
        console.log('connection refused!');
        socket.disconnect(true);
        return;
    }

    // e.g. BigRedDonkey
    const uniqueName = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        style: 'capital',
        separator: ''
    });

    let player = new Player(socket.id, uniqueName);
    players.push(player);

    io.emit('playerJoin', socket.id, uniqueName, players);
    console.log('E: playerJoin', socket.id, uniqueName, players);

    socket.on('dealCards', function (playerId) {
        console.log('R: dealCards');

        // someone requested to deal the cards
        // first of all we shuffle the deck
        deck = buildTavernDeck();
        console.log('tavern deck: ', deck);

        castle_deck = buildCastleDeck();
        console.log('castle deck: ', castle_deck);

        // then for each player we deal 5 cards
        players.forEach(x => {
            let hand = []
            for (i = 0; i < CARDS_TO_DEAL; i++)
                hand.push(deck.pop());
            x.playerHand = hand;
        });

        sendPlayerHands();

        game_info = new GameInfo();
        game_info.tavern_deck_size = deck.length;
        game_info.castle_deck_size = castle_deck.size;
        game_info.discard_pile_size = 0;
        game_info.current_player_id = playerId;

        // set the current monster
        nextMonster();
        logCurrentMonsterStatus();

        sendGameInfo();
    });

    socket.on('cardPlayed', function (cards, playerId) {

        console.log('R: cardPlayed', cards, playerId);

        if (playerId != game_info.current_player_id) {
            console.log('discard card since not from current player');
            sendGameInfo();
            return;
        }

        let player = players.find(x => x.playerId === playerId);
        if (player === undefined) {
            console.log('player not found', playerId, players);
            sendGameInfo();
            return;
        }

        // check if the player is discarding cards due to damage
        if (game_info.current_player_damage > 0) {
            const card_value = getCardsAttackValue(cards);
            game_info.current_player_damage = Math.max(0, game_info.current_player_damage - card_value);

            cards.forEach(cardId => {
                player.playerHand = player.playerHand.filter(x => x !== cardId);
                discard_pile.push(cardId);
    
                // we tell the client that a card was played
                io.emit('cardDiscarded', cardId, playerId);
                console.log('E: cardDiscarded', cardId, playerId);
            });  

            sendPlayerHands();

            if ( game_info.current_player_damage <= 0 ) {                
                console.log("player soaked all the damage, next turn...");
                nextPlayer();
            }

            // TODO send gameover
                    
            sendGameInfo();
            return;            
        }


        // STEP 1 (play a card)
        // when a card is played
        // is removed from the hand of the player
        // and added to the board        
        cards.forEach(cardId => {
            player.playerHand = player.playerHand.filter(x => x !== cardId);
            game_info.board.push(cardId);

            // we tell the client that a card was played
            io.emit('cardPlayed', cardId, playerId);
            console.log('E: cardPlayed', cardId, playerId);
        });

        sendPlayerHands();
        //sendGameInfo();

        if (hasCardSeed(cards, 'jolly')) {

            console.log('Played a jolly, disabling enemy immunity');

            // remove immunity
            game_info.monster_has_immunity = false;
            // the played will need to choose the next player

            sendGameInfo();
            return;
        }

        let double_damage = false;
        let apply_shield = false;

        let seeds = cards.map(x=>getCardSeed(x));
        // remove duplicates
        seeds = seeds.filter((v, i, a) => a.indexOf(v) === i);

        seeds.forEach(seed => {

            // STEP 2 (activate power)
            // if monster has immunity to that seed
            // no effect is applied
            if ((getCardSeed(game_info.current_monster) != seed) || !game_info.monster_has_immunity) {
                // we apply the effect of the card
                // diamonds and hearts are applied immediately
                if (seed == 'hearts') {
                    console.log('played hearts card, put cards from discard pile at the bottom of the tavern deck.');

                    const card_value = getCardsAttackValue(cards);
                    console.log('card(s) value: ', card_value);

                    // shuffle discard pile
                    discard_pile = shuffle.knuthShuffle(discard_pile.slice(0));

                    // put cards from the discard pile on the bottom of the deck
                    for (i = 0; i < card_value; i++) {
                        if (discard_pile.length > 0) {
                            deck.unshift(discard_pile.pop());
                        } else {
                            break;
                        }
                    }
                } else if (seed == 'diamonds') {
                    console.log('played diamonds card, draw cards from tavern deck.');
                    // draw cards from deck and put in players
                    // hands. max 5 cards per player.

                    const playerHands = players.map(x=>x.playerHand.length);
                    const playerCards = playerHands.reduce((a, b) => a+b, 0);
                    const maxPlayerCards = players.length * 5;
                    const maxDrawnCards = maxPlayerCards - playerCards;

                    let drawn_cards = [];
                    const card_value = getCardsAttackValue(cards);
                    let draw_card_num = Math.min(card_value, maxDrawnCards);
                    draw_card_num = Math.min(draw_card_num, deck.length);

                    console.log('card value', card_value);
                    console.log('maxDrawnCards', maxDrawnCards);
                    console.log('deck size', deck.length);
                    console.log('draw_card_num', draw_card_num);

                    for (i = 0; i < draw_card_num; i++) {
                        drawn_cards.push(deck.pop());
                    }

                    console.log('drawn cards:', drawn_cards);

                    while(true) {
                        // no more card to draw
                        if (drawn_cards.length <= 0) {
                            break;
                        }

                        let availablePlayers = players.filter(x=>x.playerHand.length < 5);
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
                            //io.emit('cardDraw', cardId, playerId);
                            //console.log('E: cardDraw', cardId, playerId);
                        }
                    }

                    console.log('drawn cards:', drawn_cards);

                    sendPlayerHands();

                } else if (seed == 'clubs') {
                    console.log('played clubs card, double damage!!!');
                    double_damage = true;
                } else if (seed == 'spades') {
                    console.log('played clubs card, shields up!');
                    apply_shield = true;
                }
            } else {
                console.log('The enemy is immune to this card effects!');
            }
        });

        // STEP 3 deal damage and check if monster is defeated
        let card_damage = getCardsAttackValue(cards);
        if (double_damage) {
            card_damage *= 2;
        }
        game_info.current_inflicted_damage += card_damage;

        console.log('inflicted damage to enemy.', card_damage);
        console.log('inflicted damage to enemy. Total damage: ', game_info.current_inflicted_damage);
        console.log('enemy hp remaining: ', (game_info.current_monster_hp-game_info.current_inflicted_damage));

        // is monster dead?
        if (game_info.current_inflicted_damage >= game_info.current_monster_hp) {
            if (game_info.current_inflicted_damage === game_info.current_monster_hp) {
                // exact kill!!! place it on top of deck
                deck.push(game_info.current_monster);
                console.log('Exact kill! Enemy card was placed face down on top of tavern deck!');
            } else {
                // overkill
                discard_pile.push(game_info.current_monster);
                console.log('Enemy down! Enemy card was placed in the discard pile!');
            }

            // discard the whole board
            while(game_info.board.length > 0) {
                discard_pile.push(game_info.board.pop());
                console.log('board', game_info.board);
                console.log('discard pile', discard_pile);
            }

            nextMonster();
            sendGameInfo();

            return;
        }

        // STEP 4 suffer damage
        let damage_suffered = getCardAttackValue(game_info.current_monster);
        if (apply_shield) {
            game_info.current_shield += getCardsAttackValue(cards);
            damage_suffered = Math.max(0, damage_suffered - game_info.current_shield);
        }

        console.log("player should suffer damage: ", damage_suffered);

        if ( damage_suffered == 0 ) {
            nextPlayer();            
        } else {
            game_info.current_player_damage = damage_suffered;
            //io.emit('sufferDamage', playerId, damage_suffered);
        }

        sendGameInfo();
    });

    /*
    socket.on('sufferDamage', function (cards, playerId) {
        console.log("R: sufferDamage", cards, playerId);

        if (playerId != game_info.current_player_id) {
            console.log("event discarded");
            return;
        }

        let player = players.find(x => x.playerId === playerId);
        if (player === undefined) {
            console.log('player not found', playerId, players);
            return;
        }        

        // check that the amount on the cards is equal or greater
        // the damage
        let card_value = getCardAttackValue(cards);
        if (card_value < game_info.current_player_damage) {
            console.log("not enough");
            return;
        }

        // discard player card
        cards.forEach(x=> {
            discard_pile.push(x);
            player.playerHand = player.playerHand.filter(y=>y!==x);
        });

        game_info.current_player_damage = 0;

        sendPlayerHands();
        nextPlayer();
        sendGameInfo();
    });*/

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        players = players.filter(player => player.playerId !== socket.id);

        console.log('players.length: ' + players.length);
    });
});

// serve static files
server.use(express.static(path.join(__dirname, './client/dist')));

http.listen(PORT, function () {
    console.log('Listening on port ', http.address().port);
});

