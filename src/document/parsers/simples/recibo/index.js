const parser = require('./parser');
const schema = require('./schema');
const rules = require('./rules');

module.exports = {
  ...parser,
  schema,
  rules
};
