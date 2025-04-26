const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.validate(req.body);

        if (result.error) {
            return res.json({
                error: 7,
                description: 'One or several input parameters is notset or set incorrectly.',
                detail: result.error.message.replace(/"/g, ""),
            });
        }

        next();
    } catch (error) {
        return res.json({
            error: 1,
            description: "Internal error. Try later please.",
        });
    }
};

module.exports = validate;
