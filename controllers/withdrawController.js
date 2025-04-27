const Member = require("../models/Member");
const Currency = require("../models/Currency");
const Transaction = require("../models/Transaction");
const TransAct = require("../models/TransAct");
const generateSign = require("../utils/signGenerator");
const insertTransaction = require("../utils/insertTransaction");

exports.Withdraw = async (req, res) => {
  try {
    const batchRequests = req.body.batch_requests || [];
    const memberAccounts = batchRequests.map((r) => r.member_account);
    const currencyCode = req.body.currency;

    const currency = await Currency.findOne({ where: { code: currencyCode } });
    const members = await Member.findAll({ where: { aasUserCode: memberAccounts } });

    const response = await Promise.all(
      members.map(async (member) => {
        const requestData = batchRequests.find(
          (r) => r.member_account === member.aasUserCode
        );
        if (!requestData) return null;

        const expectedSign = await generateSign(
          req.body.request_time,"withdraw");

        if (req.body.sign !== expectedSign) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            before_balance: 0,
            balance: 0,
            code: 1004,
            message: "API signature is invalid",
          };
        }

        if (!currency) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            before_balance: 0,
            balance: 0,
            code: 999,
            message: "API currency is invalid",
          };
        }

        const action = await TransAct.findOne({
          where: { code: requestData.transactions?.[0]?.action },
        });

        if (!action) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            before_balance: 0,
            balance: 0,
            code: 999,
            message: "API action is invalid",
          };
        }

        const existing = await Transaction.findOne({
          where: { uuid: requestData.transactions?.[0]?.id },
        });

        if (existing) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            before_balance: 0,
            balance: 0,
            code: 1003,
            message: "Duplicate API transactions",
          };
        }

        const betAmount = parseFloat(requestData.transactions?.[0]?.bet_amount || 0);
        const betAmountc = parseFloat(betAmount * currency.rate);
        const balance = member.balance/currency.rate;

        if (betAmountc > Number(member.balance)) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            before_balance: parseFloat(balance),
            balance: parseFloat(balance) - betAmount,
            code: 1001,
            message: "API member balance is insufficient",
          };
        }

        
        member.balance -= parseFloat(betAmount * currency.rate);
        member.totalDebit = Number(member.totalDebit) + parseFloat(betAmount * currency.rate);
        await member.save();

        await insertTransaction(batchRequests, currencyCode,member.agentCode,member.userCode,Number(balance),Number(member.balance));

        return {
          member_account: member.aasUserCode,
          product_code: requestData.product_code,
          before_balance: Number(balance),
          balance: Number(member.balance)/currency.rate,
          code: 0,
          message: "",
        };
      })
    );

    const notFoundRequests = batchRequests
      .filter((r) => !members.some((m) => m.aasUserCode === r.member_account))
      .map((r) => ({
        member_account: r.member_account,
        product_code: r.product_code,
        before_balance: 0,
        balance: 0,
        code: 1000,
        message: "API member does not exist",
      }));

    res.json({ data: [...response.filter(Boolean), ...notFoundRequests] });
  } catch (error) {
    return res.json({
      code: 999,
      message: 'Internal Server Error',
    });
  }
};
