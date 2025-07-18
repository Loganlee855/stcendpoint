const Transaction = require('../models/Transaction');
const GameList = require('../models/GameList');
const Currency = require("../models/Currency");

const insertTransaction = async (batchRequests = [], currencyCode,agentCode,userCode,before_balance,after_balance) => {
  for (const batch of batchRequests) {
    for (const trx of batch.transactions) {
      const check = await Transaction.findOne({
        where: { uuid: trx.id },
      });

      const games = await GameList.findOne({
        where: { 
          product_code: batch.product_code,
          game_code: trx.game_code,
         },
      });

      const currency = await Currency.findOne({ where: { code: currencyCode } });

      if (!check) {
        if (games) {
          await Transaction.create({
            uuid: trx.id,
            agentCode: agentCode,
            userCode: userCode,
            member_account: batch.member_account,
            before_balance: before_balance/currency.rate,
            after_balance: after_balance/currency.rate,
            action: trx.action,
            amount: trx.amount/currency.rate,
            currency: currencyCode,
            valid_bet_amount: trx.valid_bet_amount/currency.rate,
            bet_amount: trx.bet_amount/currency.rate,
            prize_amount: trx.prize_amount/currency.rate,
            tip_amount: trx.tip_amount,
            wager_code: trx.wager_code,
            wager_status: trx.wager_status,
            payload: JSON.stringify(trx.payload),
            settled_at: trx.settled_at,
            product_code: batch.product_code,
            game_code: trx.game_code,
            provider_code: games.provider_code,
            provider_id: games.provider,
            game_name: games.game_name,
            game_type: batch.game_type,
          });
        } else {
          await Transaction.create({
            uuid: trx.id,
            agentCode: agentCode,
            userCode: userCode,
            member_account: batch.member_account,
            before_balance: before_balance/currency.rate,
            after_balance: after_balance/currency.rate,
            action: trx.action,
            amount: trx.amount/currency.rate,
            currency: currencyCode,
            valid_bet_amount: trx.valid_bet_amount/currency.rate,
            bet_amount: trx.bet_amount/currency.rate,
            prize_amount: trx.prize_amount/currency.rate,
            tip_amount: trx.tip_amount,
            wager_code: trx.wager_code,
            wager_status: trx.wager_status,
            payload: JSON.stringify(trx.payload),
            settled_at: trx.settled_at,
            product_code: batch.product_code,
            game_code: batch.product_code,
            provider_code: batch.product_code,
            provider_id: batch.product_code,
            game_name: trx.game_code,
            game_type: batch.game_type,
          });
        }
      }
    }
  }
};

module.exports = insertTransaction;
