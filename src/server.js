require('dotenv').config();

const validateConfig = require('./config/validate.config');
const config = require('./config/app.config');
const app = require('./app');

validateConfig();

app.listen(config.port, () => {
    console.log(`${config.serviceName} ${config.version} running on port ${config.port}`);
});
