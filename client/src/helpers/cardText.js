function getCardSeed(cardId) {
    if (cardId >= 1 && cardId <= 13) {
        return 'Picche';
    }
    if (cardId >= 14 && cardId <= 26) {
        return 'Quadri';
    }
    if (cardId >= 27 && cardId <= 39) {
        return 'Cuori';
    }
    if (cardId >= 40 && cardId <= 52) {
        return 'Fiori';
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

    if (value == 0) {
        return 'Re';
    }
    if (value == 12) {
        return 'Regina';
    }
    if (value == 11) {
        return 'Jack';
    }

    return value.toString();
}

export function getCardString(cardId) {
    if (cardId == 53 || cardId === 54) {
        return 'Jolly'
    }

    let cardKind = getCardKind(cardId);
    let cardSeed = getCardSeed(cardId);    
    return `${cardKind} di ${cardSeed}`;
}