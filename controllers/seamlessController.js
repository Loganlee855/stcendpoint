const Member = require("../models/Member");
const Currency = require("../models/Currency");
const generateSign = require("../utils/signGenerator");
const { sendError } = require("../utils/telegram");

exports.getBalance = async (req, res) => {
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
          req.body.request_time,
          "getbalance"
        );

        if (req.body.sign !== expectedSign) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            balance: 0,
            code: 1004,
            message: "API signature is invalid",
          };
        }

        if (!currency) {
          return {
            member_account: member.aasUserCode,
            product_code: requestData.product_code,
            balance: 0,
            code: 999,
            message: "API currency is invalid",
          };
        }

        return {
          member_account: member.aasUserCode,
          product_code: requestData.product_code,
          balance: parseFloat(member.balance)/currency.rate,
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
        balance: 0,
        code: 1000,
        message: "API member does not exist",
      }));

    res.json({ data: [...response.filter(Boolean), ...notFoundRequests] });
  } catch (error) {
    sendError(error, "Callback | getBalance",'Callback | getBalance');
    return res.json({
      code: 999,
      message: 'Internal Server Error',
    });
  }
};
