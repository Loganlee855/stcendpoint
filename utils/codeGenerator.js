
async function normalized(gameName, gameType) {
  const normalizedGameName = gameName.toLowerCase().replace(/\s+/g, "");

  const gameTypeMapping = {
    SLOT: "_slot",
    LIVE_CASINO: "_casino",
    LIVE_CASINO_PREMIUM: "_casinoplus",
    VIRTUAL_SPORT: "_virtual",
    SPORT_BOOK: "_sport",
    COCK_FIGHTING: "_cockfighting",
    LOTTERY: "_lottery",
    QIPAI: "_qipai",
    POKER: "_poker",
    ESPORT: "_esport",
    BONUS: "_bonus",
    FISHING: "_fishing",
    P2P: "_p2p",
    OTHER: "_ot",
  };

  const mappedType = gameTypeMapping[gameType] || "";

  const result = normalizedGameName + mappedType;

  return result;
}

module.exports = normalized;
