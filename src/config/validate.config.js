const config = require('./app.config');

const MINIMUM_KEY_LENGTH = 32;

module.exports = function validateConfig() {
    if (!config.apiKeyRequired) {
        return;
    }

    if (!config.apiKey) {
        throw new Error('A variável de ambiente API_KEY é obrigatória quando API_KEY_REQUIRED=true.');
    }

    if (config.apiKey.length < MINIMUM_KEY_LENGTH) {
        throw new Error(`A API_KEY deve possuir pelo menos ${MINIMUM_KEY_LENGTH} caracteres.`);
    }

    if (config.apiKey === 'dev-secret-key') {
        throw new Error('A chave padrão dev-secret-key não pode ser usada.');
    }
};
