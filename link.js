
function link(el, data) {
  'use strict';
  if (!el || !data) throw Error('el and data are required!');
  if(!isObject(data)) throw Error('data must be object');
  var model = data,
    bindings = [], // store bindings
    watchMap = Object.create(null), // stores watch prop & watchfns mapping 
    //regex 
    interpolationRegex = /\{\{(\w+)\}\}/g;

  function getInterpolationWatch(text) {
    if (text) {
      var ar, resultArr = [];
      while (ar = interpolationRegex.exec(text)) {
        resultArr.push(ar[1]);
      }
    }

    return resultArr;
  }

  function evalInterpolation(binding) {
    var len = binding.prop.length,
      prop,
      el = binding.el,
      tpl = binding.tpl;
    while (len--) {
      prop = binding.prop[len];
      tpl = tpl.replace(new RegExp('{{' + prop + '}}', 'g'), getWatchValue(prop));
    }

    return tpl;
  }


  function compile(el) {
    var prop,
      binding;
    if (el.hasAttribute && el.hasAttribute('x-bind')) {
      // bindings.push({ el: el, prop: el.getAttribute('x-bind'), action: 'bind' });
      binding = { el: el, prop: el.getAttribute('x-bind'), action: 'bind' };
    }
    else if (el.hasAttribute && el.hasAttribute('x-model')) {
      // bindings.push({ el: el, prop: el.getAttribute('x-model'), action: 'model' });
      binding = { el: el, prop: el.getAttribute('x-model'), action: 'model' };
      prop = el.getAttribute('x-model');
      if (el.nodeName === 'INPUT') {
        if (el.type === 'text') {
          el.addEventListener('keyup', function () {
            setWatchValue(prop, el.value || '');
          }, false);
        }
        else if (el.type === 'radio') {
          //TODO: handler radio
          el.addEventListener('change', function () {
            setWatchValue(prop, el.value || '');
          }, false);
        }

      }
      else if (el.nodeName === 'SELECT') {
        el.addEventListener('change', function () {
          setWatchValue(prop, el.value || '');
        }, false);
      }
    }
    else if (el.nodeType === 3) {
      // text node , and it may contains several interpolation expr
      prop = getInterpolationWatch(el.textContent)
      if (prop.length > 0) {
        // bindings.push({ el: el, prop: prop, action: 'bind', tpl: el.textContent });
        binding = { el: el, prop: prop, action: 'bind', tpl: el.textContent };
      }

    }
    if (binding) {
      bindings.push(binding);
      // check binding prop, if string , simple bind or model, if array it's text interpilation
      if (typeof binding.prop === 'string') {
        if (!watchMap[binding.prop]) {
          watchMap[binding.prop] = [];
        }
        watchMap[binding.prop].push(renderBuilder(binding));
      }
      else if (typeof binding.prop === 'object' && binding.prop.length) {
        // every prop watch need notifying the binding change
        var len = binding.prop.length;
        while (len--) {
          if (!watchMap[binding.prop[len]]) {
            watchMap[binding.prop[len]] = [];
          }
          watchMap[binding.prop[len]].push(renderBuilder(binding));
        }
      }
    }

    var childNodes = el.childNodes,
      len = childNodes.length,
      node;
    for (var i = 0; i < len; i++) {
      node = childNodes[i];
      compile(childNodes[i]);
    }
  }

  function getWatchValue(watch) {
    var val = model;
    if (watch) {
      watch = watch.split('.');
      var len = watch.length;
      for (var i = 0; i < len; i++) {
        val = val[watch[i]]
      }
    }

    return val;
  }

  function setWatchValue(watch, value) {
    var val = model;
    if (watch) {
      watch = watch.split('.');
      var len = watch.length;
      if (len === 1) {
        model[watch] = value;
        return;
      }
      for (var i = 0; i < len; i++) {
        val = val[watch[i]]
        if (i === len - 2) {
          val[watch[len - 1]] = value;
          return;
        }
      }
    }
  }

  function renderBuilder(binding) {
    //return ui render fn
    return function () {
      if (binding.action === 'bind' && !(binding.prop instanceof Array)) {
        binding.el.innerText = getWatchValue(binding.prop);
      }
      else if (binding.action === 'model') {
        binding.el.value = getWatchValue(binding.prop);
      }
      else if (binding.prop instanceof Array) {
        // text node for interpolation expr 
        binding.el.textContent = evalInterpolation(binding);
      }
    }
  }

  function isObject(obj) {
    return obj && typeof obj === 'object';
  }

  function notify(watch) {
    var rendersArray = watchMap[watch],
      len;
    if (rendersArray) {
      len = rendersArray.length;

      while (len--) {
        rendersArray[len].apply();
      }
    }
  }

  function render() {
    for (var watch in watchMap) {
      notify(watch);
    }
  }

  function watchModel(model, propStack) {
    //object
    propStack = propStack || [];
    var keys = Object.keys(model), len = keys.length, prop, value;
    while (len--) {
      prop = keys[len];
      value = model[prop];

      if (isObject(value)) {
        propStack.push(prop);
        watchModel(value, propStack);
        propStack.pop();
      }
      else {
        (function (prop, value, propStack) {
          if (propStack) {
            propStack.push(prop);
          }
          else {
            propStack = [prop];
          }

          var watch = propStack.join('.');

          Object.defineProperty(model, prop, {
            get: function () {
              return value;
            },
            set: function (newVal) {
              if (newVal !== value) {
                value = newVal;
                notify(watch);
              }
            }
          })
        })(prop, value, propStack.slice(0));
      }
    }
  }

  function bootstrap() {
    compile(el);
    watchModel(model);
    render();
  };

  bootstrap();

  // public methods
  function updateModel(newModel, reScan) {
    model = newModel;
    if (reScan === true) {
      ar = [];
      compile(el);
    }
    watchModel(model);
    render();
  }


  return {
    updateModel: updateModel
  };

};

