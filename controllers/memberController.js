const Member = require("../models/Member");
const Agent = require("../models/Agent");
const userTransaction = require("../models/userTransaction");
const UserBalanceProgress = require("../models/userBalanceProgress");
const ProviderList = require("../models/ProviderList");
const GameList = require("../models/GameList");
const GameRounds = require("../models/Transaction");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const ApiCredential = require("../models/ApiCredential");
const LaunchData = require("../models/LaunchGame");
const axios = require("axios");
const transformGameData = require("../utils/codeGenerator");
const dayjs = require("dayjs");
const generateHash = require("../utils/hashGenerator");
const {
  createMemberGs,
  getBalanceGs,
  depositGs,
  withdrawGs,
  launchGamesGs,
  filterTeXtusER,
} = require("../utils/gamingsoftModule");
const crypto = require("crypto");
const generateSign = require("../utils/signCreator");
require("dotenv").config();
const { sendError, getCurrency } = require("../utils/telegram");

exports.create = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      secretKey: agents.secretkey,
    };
    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const existing = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        userCode: externalPlayerId,
      },
    });

    const userCount =
      (await Member.count({ where: { agentCode: agents.agentCode } })) + 1;

    if (existing) {
      return res.json({
        error: 9,
        description: "externalPlayerId already exists",
      });
    }

    const parentPath = agents.parentPath;
    const userCodes =
      filterTeXtusER(agents.secureLogin) +
      userCount.toString().padStart(3, "0") +
      filterTeXtusER(externalPlayerId);

    const createMemberGsResponse = await createMemberGs(
      userCodes.toLowerCase()
    );
    if (createMemberGsResponse.errCode && createMemberGsResponse.errCode != 0) {
      return res.json({
        error: createMemberGsResponse.errCode,
        description:
          createMemberGsResponse.errMsg || "Failed to create member in Api",
      });
    }

    const players = await Member.create({
      uuid: uuidv4(),
      agentCode: agents.agentCode,
      userCode: externalPlayerId,
      balance: 0,
      aasUserCode: userCodes.toLowerCase(),
      parentPath,
      status: 1,
    });

    return res.json({
      error: 0,
      description: "OK",
      playerId: players.aasUserCode,
    });
  } catch (err) {
    console.error("Error sending message:", err);
    sendError(
      err,
      "API | IntegrationService | Create Account",
      req.originalUrl
    );
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.balance = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      secretKey: agents.secretkey,
    };
    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const users = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        aasUserCode: externalPlayerId,
      },
    });

    if (!users) {
      return res.json({
        error: 17,
        description: "Player not found",
      });
    }

    if (users.lastPlay !== "not") {
      const balanceResponse = await getBalanceGs(
        users.aasUserCode,
        users.lastPlay
      );
      if (balanceResponse.errCode && balanceResponse.errCode != 0) {
        return res.json({
          error: balanceResponse.errCode,
          description:
            balanceResponse.errMsg || "Failed to get balance from Api",
        });
      } else {
        users.balance = Number(balanceResponse.balance);
        await users.save();
      }
    }

    return res.json({
      error: 0,
      description: "OK",
      balance: Number(users.balance),
    });
  } catch (err) {
    console.error("Error in getBalance:", err);
    sendError(err, "API | IntegrationService | Get Balance", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.transfer = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId, amount } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      amount: amount,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const users = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        aasUserCode: externalPlayerId,
      },
    });

    if (!users) {
      return res.json({
        error: 17,
        description: "Player not found",
      });
    }

    const transactionCount =
      (await userTransaction.count({
        where: { agentCode: agents.agentCode, userCode: users.userCode },
      })) + 1;
    const transCode =
      "TRF" +
      agents.agentCode +
      externalPlayerId +
      transactionCount.toString().padStart(6, "0");

    const agentBeforeBalance = Number(agents.balance);
    const agentAfterBalance = agentBeforeBalance - Number(amount);

    if (agentBeforeBalance < Number(amount)) {
      return res.json({
        error: 25,
        description:
          "Insufficient Agent funds available to completethe transaction.",
      });
    }

    const userBeforeBalance = Number(users.balance);
    const userAfterBalance = userBeforeBalance + Number(amount);
    await agents.update({ balance: agentAfterBalance });
    await users.update({ balance: userAfterBalance });

    if (users.lastPlay !== "not") {
      await depositGs(users.aasUserCode, users.lastPlay, amount);
    }

    UserBalanceProgress.create({
      agentCode: agents.agentCode,
      userCode: users.userCode,
      userBalance: userAfterBalance,
      comment: `[User Deposit] (${users.userCode}): ${amount}`,
      parentPath: agents.parentPath,
    });

    userTransaction.create({
      transaction_id: transCode.toUpperCase(),
      agentCode: agents.agentCode,
      userCode: users.userCode,
      chargeType: 1,
      chargeAmount: Number(amount),
      agentPrevBalance: agentBeforeBalance,
      agentAfterBalance: agentAfterBalance,
      userPrevBalance: userBeforeBalance,
      userAfterBalance: userAfterBalance,
      status: 1,
      parentPath: agents.parentPath,
    });

    return res.json({
      error: 0,
      description: "OK",
      transactionId: transCode.toUpperCase(),
      balance: Number(users.balance),
    });
  } catch (err) {
    console.error("Error in transfer:", err);
    sendError(err, "API | IntegrationService | Transfer", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId, amount } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      amount: amount,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const users = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        aasUserCode: externalPlayerId,
      },
    });

    if (!users) {
      return res.json({
        error: 17,
        description: "Player not found",
      });
    }

    if (users.lastPlay !== "not") {
      const balanceResponse = await getBalanceGs(
        users.aasUserCode,
        users.lastPlay
      );
      if (balanceResponse.errCode && balanceResponse.errCode != 0) {
        return res.json({
          error: balanceResponse.errCode,
          description:
            balanceResponse.errMsg || "Failed to get balance from Api",
        });
      } else {
        if (balanceResponse.balance > 0) {
          const gsresponse = await withdrawGs(
            users.aasUserCode,
            users.lastPlay,
            amount
          );
          if (gsresponse.errCode && gsresponse.errCode != 0) {
            return res.json({
              error: gsresponse.errCode,
              description: gsresponse.errMsg || "Failed to withdraw from Api",
            });
          }
        }
      }
    }

    const transactionCount =
      (await userTransaction.count({
        where: { agentCode: agents.agentCode, userCode: users.userCode },
      })) + 1;
    const transCode =
      "WDH" +
      agents.agentCode +
      externalPlayerId +
      transactionCount.toString().padStart(4, "0");

    const agentBeforeBalance = Number(agents.balance);
    const agentAfterBalance = agentBeforeBalance + Number(amount);

    const userBeforeBalance = Number(users.balance);
    const userAfterBalance = userBeforeBalance - Number(amount);

    if (userBeforeBalance < Number(amount)) {
      return res.json({
        error: 1,
        description: "Insufficient funds available to completethe transaction.",
      });
    }

    await agents.update({ balance: agentAfterBalance });
    await users.update({ balance: userAfterBalance });

    UserBalanceProgress.create({
      agentCode: agents.agentCode,
      userCode: users.userCode,
      userBalance: userAfterBalance,
      comment: `[User Withdraw] (${users.userCode}): ${amount}`,
      parentPath: agents.parentPath,
    });

    userTransaction.create({
      transaction_id: transCode.toUpperCase(),
      agentCode: agents.agentCode,
      userCode: users.userCode,
      chargeType: 0,
      chargeAmount: Number(amount),
      agentPrevBalance: agentBeforeBalance,
      agentAfterBalance: agentAfterBalance,
      userPrevBalance: userBeforeBalance,
      userAfterBalance: userAfterBalance,
      status: 1,
      parentPath: agents.parentPath,
    });

    return res.json({
      error: 0,
      description: "OK",
      transactionId: transCode.toUpperCase(),
      balance: Number(users.balance),
    });
  } catch (err) {
    sendError(err, "API | IntegrationService | Withdraw", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.casinoprovider = async (req, res) => {
  try {
    const { secureLogin, hash } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const providers = await ProviderList.findAll({
      attributes: ["provider_name", "provider_code", "game_type", "status"],
      order: [
        ["game_type", "ASC"],
        ["status", "ASC"],
      ],
    });

    return res.json({
      error: 0,
      description: "OK",
      providers,
    });
  } catch (err) {
    sendError(err, "API | IntegrationService | Provider List", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.casinogame = async (req, res) => {
  try {
    const { secureLogin, hash, provider_code } = req.body;
    const agents = await Agent.findOne({ where: { agentCode: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      provider_code: provider_code,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const games = await GameList.findAndCountAll({
      where: {
        provider_code: provider_code,
      },
      attributes: [
        "provider",
        "provider_code",
        "game_name",
        "game_code",
        "game_image",
        "game_type",
        "status",
      ],
      order: [
        ["game_type", "ASC"],
        ["status", "ASC"],
      ],
    });

    if (!games) {
      return res.json({
        error: 8,
        description: "Game is not found or disabled",
      });
    }

    return res.json({
      error: 0,
      description: "OK",
      games: games.rows,
      count: games.count,
    });
  } catch (err) {
    sendError(err, "API | IntegrationService | Games List", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.GetGameRounds = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId, provider_code } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      provider_code: provider_code,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const users = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        aasUserCode: externalPlayerId,
      },
    });

    if (!users) {
      return res.json({
        error: 17,
        description: "Player not found",
      });
    }

    const history = await GameRounds.findAndCountAll({
      where: {
        agentCode: agents.agentCode,
        userCode: users.userCode,
        provider_code: provider_code || { [Op.ne]: null },
      },
      attributes: [
        "uuid",
        "agentCode",
        "userCode",
        "provider_code",
        "game_code",
        "game_name",
        "game_type",
        "amount",
        "bet_amount",
        "prize_amount",
        "before_balance",
        "after_balance",
        "action",
        "currency",
        "wager_code",
        "wager_status",
        "settled_at",
        "createdAt",
        "payload",
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = history.rows.map((item) => {
      if (item.payload) {
        try {
          item.payload = JSON.parse(item.payload);
        } catch (error) {
          item.payload = null;
        }
      }
      return item;
    });

    return res.json({
      code: 0,
      description: "OK",
      data: data,
      count: history.count,
    });
  } catch (err) {
    sendError(err, "API | IntegrationService | GetGameRounds", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.GetGameRoundsDetails = async (req, res) => {
  try {
    const { wager_code } = req.params;
    const { secureLogin, hash } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const getWager = await GameRounds.findOne({
      where: { wager_code: wager_code },
    });

    if (!getWager) {
      return res.json({
        error: 3,
        description: "wager not found",
      });
    }

    const timestamp = dayjs().format("YYYYMMDDHH");
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(timestamp, "gamehistory");
    const params = {
      operator_code: api.apikey,
      sign: Sign,
      request_time: timestamp,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(
      `${api.url}api/operators/${wager_code}/game-history?${query}`
    );

    if (!response.data.content) {
      return res.json({
        error: 3,
        description: "wager not found",
      });
    }

    let url;
    let content;
    if (getWager.provider_code == "pgsoft_slot") {
      url = null;
      content = response.data.content;
    } else {
      url = response.data.content;
      content = null;
    }

    const launchData = await LaunchData.create({
      uuid: crypto.randomBytes(16).toString("hex"),
      token:
        crypto.randomBytes(36).toString("hex") +
        crypto.randomBytes(32).toString("hex"),
      content: content || null,
      url: url || null,
      expiredAt: new Date(new Date().getTime() + 5 * 60 * 1000),
    });

    const paramsd = {
      t: launchData.token,
      i: launchData.uuid,
      e: launchData.expiredAt.getTime(),
      s: getWager.provider_code,
    };

    const querys = new URLSearchParams(paramsd).toString();
    const domain = req.get("Host");
    return res.json({
      error: 0,
      description: "OK",
      data: `https://${domain}/rs/parentRoundHistoryDetails?${querys}`,
    });
  } catch (err) {
    sendError(
      err,
      "API | IntegrationService | GetGameRoundsDetails",
      req.originalUrl
    );
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.GetGameLaunch = async (req, res) => {
  try {
    const {
      secureLogin,
      hash,
      externalPlayerId,
      provider_code,
      game_code,
      platform,
      language,
      lobbyURL,
    } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    let sechash;
    if (!game_code) {
      sechash = {
        secureLogin: secureLogin,
        externalPlayerId: externalPlayerId,
        provider_code: provider_code,
        platform: platform || null,
        language: language,
        lobbyURL: lobbyURL,
        secretKey: agents.secretkey,
      };
    } else {
      sechash = {
        secureLogin: secureLogin,
        externalPlayerId: externalPlayerId,
        provider_code: provider_code,
        game_code: game_code || null,
        platform: platform || null,
        language: language,
        lobbyURL: lobbyURL,
        secretKey: agents.secretkey,
      };
    }

    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const users = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        aasUserCode: externalPlayerId,
      },
    });

    if (!users) {
      return res.json({
        error: 17,
        description: "Player not found",
      });
    }

    if (Number(agents.balance) < 10000) {
      return res.json({
        error: 25,
        description:
          "Insufficient Agent funds available to completethe transaction.",
      });
    }

    const games = await GameList.findOne({
      where: {
        provider_code: provider_code,
        game_code: game_code || { [Op.ne]: null },
      },
    });

    if (!games) {
      return res.json({
        error: 6,
        description: "Game is not found or is not allowed foryour system",
      });
    } else if (games.status != 1) {
      return res.json({
        error: 10,
        description: "Game is under maintenance",
      });
    }

    const providerscs = await ProviderList.findOne({
      where: {
        provider_code: provider_code,
      },
    });

    const gtypes = await transformGameData(games.game_type);

    const launchGamesGsResponse = await launchGamesGs(
      users.aasUserCode,
      providerscs.product_code,
      gtypes,
      game_code,
      "id-ID"
    );

    if (launchGamesGsResponse.errCode && launchGamesGsResponse.errCode != 0) {
      return res.json({
        error: launchGamesGsResponse.errCode,
        description:
          launchGamesGsResponse.errMsg || "Failed to launch game in Api",
      });
    }

    const launchData = await LaunchData.create({
      uuid: crypto.randomBytes(16).toString("hex"),
      token:
        crypto.randomBytes(36).toString("hex") +
        crypto.randomBytes(32).toString("hex"),
      content: launchGamesGsResponse.content || null,
      url: launchGamesGsResponse.gameUrl || null,
      expiredAt: new Date(new Date().getTime() + 5 * 60 * 1000),
    });

    const params = {
      t: launchData.token,
      i: launchData.uuid,
      e: launchData.expiredAt.getTime(),
    };

    const query = new URLSearchParams(params).toString();
    const domain = req.get("Host");

    if (users.lastPlay !== "not") {
      const balanceResponse = await getBalanceGs(
        users.aasUserCode,
        users.lastPlay
      );
      if (balanceResponse.errCode && balanceResponse.errCode != 0) {
        return res.json({
          error: balanceResponse.errCode,
          description:
            balanceResponse.errMsg || "Failed to get balance from Api",
        });
      } else if (users.lastPlay !== providerscs.product_code) {
        if (balanceResponse.balance > 0) {
          await withdrawGs(
            users.aasUserCode,
            users.lastPlay,
            balanceResponse.balance
          );
        }
        await depositGs(
          users.aasUserCode,
          providerscs.product_code,
          users.balance
        );
      }
    } else {
      await depositGs(
        users.aasUserCode,
        providerscs.product_code,
        users.balance
      );
    }

    if (users.balance > 0) {
      users.lastPlay = providerscs.product_code;
      await users.save();
    }

    return res.json({
      error: 0,
      description: "OK",
      gameURL: `https://${domain}/games/${provider_code}/launch?${query}`,
    });
  } catch (err) {
    console.error("Error launching game:", err);
    sendError(err, "API | IntegrationService | Launch Game", req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.balance_agent = async (req, res) => {
  try {
    const { secureLogin, hash } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    if (agents.status != 1) {
      return res.json({
        error: 10000,
        description: "Agent Blocked.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      secretKey: agents.secretkey,
    };
    const hashParams = await generateHash(
      new URLSearchParams(sechash).toString()
    );

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description:
          "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    return res.json({
      error: 0,
      description: "OK",
      balance: Number(agents.balance),
    });
  } catch (err) {
    sendError(
      err,
      "API | IntegrationService | Get Agent Balance",
      "Provider List"
    );
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};
