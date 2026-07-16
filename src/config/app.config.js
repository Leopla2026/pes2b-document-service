const packageJson = require('../../package.json');

function parseBoolean(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    return String(value).trim().toLowerCase() === 'true';
}

module.exports = {
    serviceName: 'pes2b-document-service',
    version: packageJson.version,
    environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
    apiKey: String(process.env.API_KEY || '').trim(),
    apiKeyRequired: parseBoolean(process.env.API_KEY_REQUIRED, true),
    port: Number(process.env.PORT || 3000)
};
