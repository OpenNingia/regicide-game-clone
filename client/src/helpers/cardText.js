function getCardSeed(cardId) {
    if (cardId >= 1 && cardId <= 13) {
        return 'Fiori';
    }
    if (cardId >= 14 && cardId <= 26) {
        return 'Quadri';
    }
    if (cardId >= 27 && cardId <= 39) {
        return 'Cuori';
    }
    if (cardId >= 40 && cardId <= 52) {
        return 'Picche';
    }
    return '???';
}

function getCardKind(cardId) {
    if (cardId == 0) {
        return '???';
    }

    if (cardId == 53 || cardId === 54) {
        return 'Jolly';
    }

    let value = cardId % 13;
    const values = [
        'Re',
        'Asso',
        'Due',
        'Tre',
        'Quattro',
        'Cinque',
        'Sei',
        'Sette',
        'Otto',
        'Nove',
        'Dieci',
        'Jack',
        'Regina',
    ]

    return values[value];
}

export function getCardString(cardId) {
    if (cardId == 53 || cardId === 54) {
        return 'Jolly'
    }

    let cardKind = getCardKind(cardId);
    let cardSeed = getCardSeed(cardId);    
    return `${cardKind} di ${cardSeed}`;
}