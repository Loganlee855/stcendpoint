const Member = require("../models/Member");
const Currency = require("../models/Currency");
const { sendError } = require("../utils/telegram");

exports.pushbet = async (req, res) => {
  try {
    const transactions = req.body.wagers?.[0];
    if (!transactions) {
      return res.json({
        code: 999,
        message: "Internal Server Error",
      });
    }

    const member = await Member.findOne({
      where: { aasUserCode: transactions.member_account },
    });

    const currency = await Currency.findOne({
      where: { code: transactions.currency },
    });

    if (!member) {
      return res.json({
        code: 1000,
        message: "API member does not exist",
        before_balance: 0,
        balance: 0,
      });
    }

    const beforeBalance = Number(member.balance);
    const updatedBalance = beforeBalance + transactions.prize_amount - transactions.bet_amount;

    return res.json({
      code: 0,
      message: "",
      before_balance: beforeBalance/currency.rate,
      balance: updatedBalance/currency.rate,
    });

  } catch (err) {
    sendError(err, "Callback | PushBet",'Callback | PushBet');
    return res.json({
      code: 999,
      message: "Internal Server Error",
    });
  }
};
