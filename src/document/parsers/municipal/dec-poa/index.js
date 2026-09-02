const parser = require('./parser');
const rules = require('./rules');
const schema = require('./schema');

module.exports = Object.freeze({
  ...parser,
  rules,
  schema
});