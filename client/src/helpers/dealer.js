import Card from './card';

// manages the deck
export default class Dealer {
    constructor(scene) {

        let sprites = [
            'card-back1',            

            'card-clubs-1',  // 1
            'card-clubs-2',
            'card-clubs-3',
            'card-clubs-4',
            'card-clubs-5',
            'card-clubs-6',
            'card-clubs-7',
            'card-clubs-8',
            'card-clubs-9',
            'card-clubs-10',
            'card-clubs-11', // J = 11
            'card-clubs-12', // Q = 12
            'card-clubs-13', // K = 13

            'card-diamonds-1',
            'card-diamonds-2',
            'card-diamonds-3',
            'card-diamonds-4',
            'card-diamonds-5',
            'card-diamonds-6',
            'card-diamonds-7',
            'card-diamonds-8',
            'card-diamonds-9',
            'card-diamonds-10',
            'card-diamonds-11', // J = 24
            'card-diamonds-12', // Q = 25
            'card-diamonds-13', // K = 26

            'card-hearts-1',
            'card-hearts-2',
            'card-hearts-3',
            'card-hearts-4',
            'card-hearts-5',
            'card-hearts-6',
            'card-hearts-7',
            'card-hearts-8',
            'card-hearts-9',
            'card-hearts-10',
            'card-hearts-11', // J = 37
            'card-hearts-12', // Q = 38
            'card-hearts-13', // K = 39

            'card-spades-1',
            'card-spades-2',
            'card-spades-3',
            'card-spades-4',
            'card-spades-5',
            'card-spades-6',
            'card-spades-7',
            'card-spades-8',
            'card-spades-9',
            'card-spades-10',
            'card-spades-11', // J = 50
            'card-spades-12', // J = 51
            'card-spades-13', // J = 52

            'card-blank',
            'card-blank',
        ]

        this.getSprite = (cardId) => {
            return sprites[cardId];
        }

        this.dealCards = (players) => {           
            // clean everything
            scene.players.forEach(x=> {
                x.gameObjects.forEach(y=>y.destroy())
                x.gameObjects = [];
            });

            scene.me.gameObjects.forEach(y=>y.destroy())
            scene.me.gameObjects = [];

            let cardsCoords = [
                {x:40, y:100, sprite: 'card-back2'},
                {x:340, y:100, sprite: 'card-back3'},
                {x:640, y:100, sprite: 'card-back4'},
            ];

            let otherPlayerIndex = 0;
     
            for(let i = 0; i < players.length; i++) {
                let the_hand = players[i].playerHand;
                if ( players[i].playerId == scene.me.playerId ) {                    
                    console.log('dealing my hand:' + the_hand);
        
                    for (let j = 0; j < the_hand.length; j++) {
        
                        // my cards
                        let cardId = the_hand[j];
                        let card = new Card(scene, cardId);
                        let cardSprite = sprites[cardId];                
                        scene.me.gameObjects.push(
                            card.render(475 + (j * 100), 550, 1.0, true, cardSprite));
                    }  
                }
                else {                            
                    let gamePlayer = scene.players.find(x=>x.playerId==players[i].playerId);
                    let xy = cardsCoords[otherPlayerIndex++];
                    for (let j = 0; j < the_hand.length; j++) {                                                        
                        let card = new Card(scene, 0);
                        gamePlayer.gameObjects.push(
                            card.render(xy.x + (j * 50), xy.y, 0.4, false, xy.sprite));
                    }  
                }
            }         
        }
    }
}