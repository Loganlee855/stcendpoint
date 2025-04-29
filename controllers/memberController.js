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
const dayjs = require("dayjs");
const generateHash = require("../utils/hashGenerator");
const crypto = require('crypto');
const generateSign = require("../utils/signCreator");
require('dotenv').config();
const sendError = require("../utils/telegram");

exports.create = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId } = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      secretKey: agents.secretkey,
    };
    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const existing = await Member.findOne({
      where: {
        agentCode: agents.agentCode,
        userCode: externalPlayerId,
      },
    });

    const userCount = (await Member.count({ where: { agentCode: agents.agentCode } })) + 1;

    if (existing) {
      return res.json({
        error: 9,
        description: "externalPlayerId already exists",
      });
    }

    const parentPath = agents.parentPath;
    const userCodes = agents.secureLogin + "PL" + userCount.toString().padStart(6, "0");

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
    sendError(err, "API | IntegrationService | Create Account",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      secretKey: agents.secretkey,
    };
    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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

    return res.json({
      code: 0,
      description: "OK",
      balance: Number(users.balance),
    });
  } catch (err) {
    sendError(err, "API | IntegrationService | Get Balance",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      amount: amount,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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
        status: 17,
        description: "Player not found",
      });
    }

    const transactionCount = (await userTransaction.count({ where: { agentCode: agents.agentCode, userCode: users.userCode,}, })) + 1;
    const transCode = "TRF" + agents.agentCode + externalPlayerId + transactionCount.toString().padStart(6, "0");

    const agentBeforeBalance = Number(agents.balance);
    const agentAfterBalance = agentBeforeBalance - Number(amount);

    const userBeforeBalance = Number(users.balance);
    const userAfterBalance = userBeforeBalance + Number(amount);
    await agents.update({ balance: agentAfterBalance });
    await users.update({ balance: userAfterBalance });

    if (agentBeforeBalance < Number(amount)) {
      return res.json({
        error: 25,
        description: "Insufficient Agent funds available to completethe transaction.",
      });
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
    sendError(err, "API | IntegrationService | Transfer",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      amount: amount,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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
        status: 17,
        description: "Player not found",
      });
    }

    const transactionCount = (await userTransaction.count({ where: { agentCode: agents.agentCode, userCode: users.userCode,},})) + 1;
    const transCode = "WDH" + agents.agentCode + externalPlayerId + transactionCount.toString().padStart(4, "0");

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
    sendError(err, "API | IntegrationService | Withdraw",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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
    sendError(err, "API | IntegrationService | Provider List",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      provider_code: provider_code,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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
    sendError(err, "API | IntegrationService | Games List",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      provider_code: provider_code,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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
        "game_type",
        "amount",
        "bet_amount",
        "before_balance",
        "after_balance",
        "action",
        "currency",
        "bet_amount",
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
    sendError(err, "API | IntegrationService | GetGameRounds",req.originalUrl);
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
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const getWager = await GameRounds.findOne({ where: { wager_code: wager_code } });

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
    const response = await axios.get(`${api.url}api/operators/${wager_code}/game-history?${query}`);

    if (!response.data.content) {
      return res.json({
        error: 3,
        description: "wager not found",
      });
    }

    let url;
    let content;
    if (getWager.provider_code == 'pgsoft_slot') {
      url = null;
      content = response.data.content;
    } else {
      url = response.data.content;
      content = null;
    }

    const launchData = await LaunchData.create({
      uuid: crypto.randomBytes(16).toString('hex'),
      token: crypto.randomBytes(36).toString('hex') + crypto.randomBytes(32).toString('hex'),
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

    return res.json({
      error: 0,
      description: "OK",
      data: `https://${process.env.LAUNCH_URL}/rs/parentRoundHistoryDetails?${querys}`
    });
  } catch (err) {
    sendError(err, "API | IntegrationService | GetGameRoundsDetails",req.originalUrl);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};

exports.GetGameLaunch = async (req, res) => {
  try {
    const { secureLogin, hash, externalPlayerId, provider_code, game_code, platform, language, lobbyURL} = req.body;
    const agents = await Agent.findOne({ where: { secureLogin: secureLogin } });
    if (!agents) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
      });
    }

    const sechash = {
      secureLogin: secureLogin,
      externalPlayerId: externalPlayerId,
      provider_code: provider_code,
      game_code: game_code || '',
      platform: platform || '',
      language: language,
      lobbyURL: lobbyURL,
      secretKey: agents.secretkey,
    };

    const hashParams = await generateHash(new URLSearchParams(sechash).toString());

    if (hash != hashParams) {
      return res.json({
        error: 2,
        description: "Authentication failed. Incorrect secure login and secure password combination.",
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
        description: "Insufficient Agent funds available to completethe transaction.",
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

    const timestamp = dayjs().format("YYYYMMDDHH");
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(timestamp, "launchgame");
    const postData = {
      operator_code: api.apikey,
      member_account: users.aasUserCode,
      password: users.userCode,
      nickname: users.userCode,
      currency: games.support_currency.split(',')[0],
      game_code: games.game_code || null,
      product_code: games.product_code,
      game_type: games.game_type,
      language_code: language || 0,
      ip: "127.0.0.1",
      platform: platform || "WEB",
      sign: Sign,
      request_time: timestamp,
      operator_lobby_url: lobbyURL || 'https://google.com',
    };
    const response = await axios.post(`${api.url}api/operators/launch-game`,postData);

    if (response.data.code != 200) {
      return res.json({
        error: 10,
        description: "Game is under maintenance",
      });
    }

    const launchData = await LaunchData.create({
      uuid: crypto.randomBytes(16).toString('hex'),
      token: crypto.randomBytes(36).toString('hex') + crypto.randomBytes(32).toString('hex'),
      content: response.data.content || null,
      url: response.data.url || null,
      expiredAt: new Date(new Date().getTime() + 5 * 60 * 1000),
    });

    const params = {
      t: launchData.token,
      i: launchData.uuid,
      e: launchData.expiredAt.getTime(),
    };

    const query = new URLSearchParams(params).toString();

    return res.json({
      error: 0,
      description: "OK",
      gameURL: `https://${process.env.LAUNCH_URL}/games/${provider_code}/launch?${query}`
    });

  } catch (err) {
    sendError(err, "API | IntegrationService | Launch Game",err);
    return res.json({
      error: 1,
      description: "Internal error. Try later please",
    });
  }
};
