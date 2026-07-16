function errorResponse({ message, requestId, code, detail, field = null }) {
    return {
        success: false,
        message,
        requestId,
        data: null,
        errors: [
            {
                code,
                message: detail || message,
                field
            }
        ],
        warnings: []
    };
}

module.exports = {
    errorResponse
};
