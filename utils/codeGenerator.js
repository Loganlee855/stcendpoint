
async function normalized(gameType) {
  const gameTypeMapping = {
    SLOT: "SL",
    LIVE_CASINO: "LC",
    LIVE_CASINO_PREMIUM: "LC",
    VIRTUAL_SPORT: "ES",
    SPORT_BOOK: "SB",
    COCK_FIGHTING: "OT",
    LOTTERY: "LK",
    QIPAI: "OT",
    POKER: "PK",
    ESPORT: "ES",
    BONUS: "OT",
    FISHING: "FH",
    OTHER: "OT",
  };

  const mappedType = gameTypeMapping[gameType] || "";

  const result = mappedType;

  return result;
}

module.exports = normalized;
