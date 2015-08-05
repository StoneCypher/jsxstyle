'use strict';

var Color = require('./lib/Color');
var Display = require('./lib/Display');

var assign = require('object-assign');
var curry = require('./curry');

var index = assign({curry: curry}, Color, Display);

module.exports = index;
