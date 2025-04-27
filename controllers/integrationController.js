const axios = require("axios");
const dayjs = require("dayjs");
const Member = require("../models/Member");
const Agent = require("../models/Agent");
const Providers = require("../models/ProviderList");
const GameList = require("../models/GameList");
const Currency = require("../models/Currency");
const ApiCredential = require("../models/ApiCredential");
const generateSign = require("../utils/signCreator");
const LaunchData = require("../models/LaunchGame");
const transformGameData = require("../utils/codeGenerator");
const transformGameType = require("../utils/pcodeGenerator");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

exports.providerList = async (req, res) => {
  try {
    const timestamp = dayjs().format("YYYYMMDDHH");
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(timestamp, "productlist");
    const params = {
      operator_code: api.apikey,
      sign: Sign,
      request_time: timestamp,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(
      `${api.url}api/operators/available-products?${query}`
    );
    const products = response.data;
    for (const item of products) {
      let status
      if (item.status === 'ACTIVATED') {
        status = 1;
      } else {
        status = 0;
      }
      const prcode = await transformGameData(item.product_title, item.game_type);
      const gtypec = await transformGameType(item.game_type);
      const existing = await Providers.findOne({
        where: {
          provider_code: prcode,
        },
      });
      if (existing) {
        await existing.update({
          status: status,
          updatedAt: new Date(),
        });
      } else {
        await Providers.create({
          provider: item.provider,
          provider_name: item.product_title,
          provider_code: prcode,
          provider_id: item.provider_id,
          product_id: item.product_id,
          product_code: item.product_code,
          game_type: item.game_type,
          game_type_c: gtypec,
          status: status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return res.json({
      code: 1,
      products,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Internal Server Error",
    });
  }
};

exports.gameList = async (req, res) => {
  try {
    const { provider_code } = req.body;

    const check = await Providers.findOne({
      where: {
        provider_code: provider_code,
      },
    });

    if (!check) {
      return res.json({
        code: 0,
        message: "INVALID_PROVIDER",
      });
    }

    const timestamp = dayjs().format("YYYYMMDDHH");
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(timestamp, "gamelist");
    const params = {
      product_code: check.product_code,
      operator_code: api.apikey,
      game_type: check.game_type,
      sign: Sign,
      request_time: timestamp,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${api.url}api/operators/provider-games?${query}`);
    const products = response.data.provider_games;
    for (const item of products) {

      let status
      if (item.status === 'ACTIVATED') {
        status = 1;
      } else {
        status = 0;
      }

      const checks = await Providers.findOne({
        where: {
          product_code: item.product_code,
          game_type: item.game_type,
        },
      });

      if (checks) {
        const existing = await GameList.findOne({
          where: {
            provider_code: checks.provider_code,
            game_code: item.game_code,
            game_type: item.game_type,
          },
        });

        if (existing) {
          existing.update({
            status: status,
            updatedAt: new Date(),
          });
        } else {
          GameList.create({
            provider: checks.provider,
            provider_code: checks.provider_code,
            game_name: item.game_name,
            game_code: item.game_code,
            game_image: item.image_url,
            product_id: item.product_id,
            product_code: item.product_code,
            support_currency: item.support_currency,
            game_type: item.game_type,
            status: status,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    const games = await GameList.findAll({
      where: {
        provider_code: provider_code,
      },
    });

    return res.json({
      code: 200,
      games,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Internal Server Error",
    });
  }
};

exports.gamesLaunch = async (req, res) => {
  try {
    const { provider_code } = req.params;
    const { t, i } = req.query;

    if (!req.query || !req.query.t) {
      return res.status(403).render("error/404");
    } else if (!req.query || !req.query.i) {
      return res.status(403).render("error/404");
    } else if (!req.query || !req.query.e) {
      return res.status(403).render("error/404");
    }

    const providerd = await Providers.findOne({
      where: {
        provider_code: provider_code,
      },
    });

    if (!providerd) {
      return res.send("It seems you are not logged in.");
    }

    const currentTime = new Date();

    const data = await LaunchData.findOne({
      where: {
        uuid: i,
        token: t,
      },
    });

    if (!data) {
      return res.send("It seems you are not logged in.");
    }

    if (data && data.expiredAt < currentTime) {
      LaunchData.destroy({
        where: {
          uuid: id,
          token: token,
        },
      });
      return res.send("It seems you are not logged in.");
    }

    setTimeout(() => {
      data.destroy();
    }, 20000);

    if (data.content) {
      res.setHeader("Content-Type", "text/html");
      return res.send(data.content);
    } else {
      return res.redirect(data.url);
    }
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({
      code: 500,
      message: "Internal Server Error",
    });
  }
};

// exports.copyHtml = async (req, res) => {
//   try {
//     const url = "http://localhost:5006/games";
//     const response = await fetch(url);
//     const body = await response.text();
//     const $ = cheerio.load(body);
//     const gameData = [];
//     const gamePromises = $(".game-box").map(async (i, el) => {
//       let imgSrc = $(el).find(".image img").attr("data-src");
//       imgSrc = imgSrc.replace(/\.webp.*/, '.webp');
//       const title = $(el).find(".game-title").text().trim();
//       let gameID = $(el).find("a").attr("href");
//       let provider = $(el).find("input").attr("value");
//       if (gameID) {
//         gameID = gameID.replace(/^\/+/, '');
//         gameID = gameID.replace(/&.*$/, '');
//         gameID = gameID.replace(/\s+/g, '');
//       }
//       if (!gameID || gameID === "") {
//         gameID = null;
//       }
//       gameData.push({
//         title,
//         imgSrc,
//         gameID,
//         provider,
//       });
//       if (gameID && imgSrc) {
//         try {
//           const folder = `game_pic/${provider}`;
//           const formData = new URLSearchParams();
//           formData.append('accessKey', 'ihkvqbM8bNO');
//           formData.append('secretKey', 'YQT2eiiW8pCE1TMtWgilQXOtj10');
//           formData.append('file', imgSrc);
//           formData.append('fileName', gameID);
//           formData.append('folder', folder);

//           const apiResponse = await axios.post('http://127.0.0.1:5666/api/image/v2/upload', formData, {
//             headers: {
//               'Content-Type': 'application/x-www-form-urlencoded',
//             },
//           });

//           console.log(gameID + ' : ', apiResponse.data.data.name);
//         } catch (error) {
//           console.error('Error sending data to API:', error);
//         }
//       }
//     }).get();

//     await Promise.all(gamePromises);

//     const count = gameData.length;

//     return res.json({
//       data: gameData,
//       count: count,
//     });
//   } catch (err) {
//     console.error("Error:", err.message);
//     return res.status(500).json({
//       code: 500,
//       message: err.message,
//     });
//   }
// };

// exports.games = async (req, res) => {
//   try {
//     return res.render("games");
//   } catch (err) {
//     console.error("Error:", err.message);
//     return res.status(500).json({
//       code: 500,
//       message: "Internal Server Error",
//     });
//   }
// };