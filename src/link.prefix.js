function link(el, data) {
  'use strict';
  if (!el || !data) throw Error('el and data are required!');
  if (!isObject(data)) throw Error('data must be object');
  var model = data,
    bindings = [], // store bindings
    watchMap = Object.create(null), // stores watch prop & watchfns mapping 
    //regex 
    interpolationRegex = /\{\{(\$?[^\}]+)\}\}/g,
    watchRegex = /^\$?\w+(\.?\w+)*$/,
    directives = ['x-bind', 'x-model', 'x-repeat', 'x-show', 'x-hide'],
    allWatches = []; // store all model watches , for expr 