const { body } = require("express-validator");

const balanceValidation = [
  body("batch_requests")
    .isArray({ min: 1 })
    .withMessage("Invalid parameter batch_requests"),
  body("batch_requests.*.member_account")
    .notEmpty()
    .withMessage("Invalid parameter member_account"),

  body("currency").notEmpty().withMessage("Invalid parameter currency"),

  body("request_time").notEmpty().withMessage("Invalid parameter request_time"),

  body("operator_code")
    .notEmpty()
    .withMessage("Invalid parameter operator_code"),

  body("sign").notEmpty().withMessage("Invalid parameter sign"),
];

module.exports = balanceValidation;
