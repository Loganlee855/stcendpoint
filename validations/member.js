const Joi = require("joi");

const schemas = {
    create: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        externalPlayerId: Joi.string().min(5).max(100).required(),
        hash: Joi.string().min(5).required(),
    }),

    transfer: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        externalPlayerId: Joi.string().min(5).max(100).required(),
        amount: Joi.number().greater(0).required(),
        hash: Joi.string().min(5).required(),
    }),

    casinoprovider: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        hash: Joi.string().min(5).required(),
    }),

    casinogame: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        provider_code: Joi.string().min(5).required(),
        hash: Joi.string().min(5).required(),
    }),

    GetGameRounds: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        externalPlayerId: Joi.string().min(5).required(),
        provider_code: Joi.string().allow("").optional(),
        hash: Joi.string().min(5).required(),
    }),

    GetGameRoundsDetails: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        hash: Joi.string().min(5).required(),
    }),

    launchGame: Joi.object({
        secureLogin: Joi.string().min(5).required(),
        externalPlayerId: Joi.string().min(5).required(),
        provider_code: Joi.string().min(1).required(),
        game_code: Joi.string().allow("").optional(),
        language: Joi.number().integer().required(),
        platform: Joi.string().allow("").optional(),
        lobbyURL: Joi.string().allow("").optional(),
        hash: Joi.string().min(5).required(),
    }),
};

module.exports = schemas;
