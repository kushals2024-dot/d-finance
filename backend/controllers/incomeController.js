const Income = require('../models/Income');
module.exports = require('./crudFactory')(Income, {
  fields: ['source', 'amount', 'date', 'description'], categoryField: 'source', searchFields: ['source', 'description'],
});
