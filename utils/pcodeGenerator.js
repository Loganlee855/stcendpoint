
async function normalized(gameType) {

  const gameTypeMapping = {
    SLOT: 1,
    LIVE_CASINO: 2,
    LIVE_CASINO_PREMIUM: 3,
    SPORT_BOOK: 4,
    FISHING: 5,
    VIRTUAL_SPORT: 6,
    COCK_FIGHTING: 7,
    LOTTERY: 8,
    QIPAI: 9,
    POKER: 10,
    ESPORT: 11,
    BONUS: 12,
    P2P: 13,
    OTHER: 14,
  };

  const mappedType = gameTypeMapping[gameType] || "";

  const result = mappedType;

  return result;
}

module.exports = normalized;
