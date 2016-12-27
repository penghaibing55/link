function makeOneClonedLinkerForRepeater(linkContext, itemData, itemIndex) {
  var cloneEl = linkContext.el.cloneNode(true),
    model = linkContext.linker.model,
    childModel = Object.create(model, {
      $item: { value: itemData, enumerable: true, configurable: true, writable: true },
      $index: { value: itemIndex, enumerable: true, configurable: true, writable: true },
      $$child: { value: true }
    });

  var linker = new Link(cloneEl, childModel);
  return { el: cloneEl, linker: linker };
}

function repeatHanlder(linkContext) {
  var warr = evalLinkContext(linkContext),
    arr = warr && warr.arr,
    el = linkContext.el,
    comment = linkContext.comment,
    lastArrayChangeInfo = linkContext.lastArraychange,
    repeaterItem,
    lastLinks = linkContext.lastLinks || [];

  if (!linkContext.$$elRemovedFromDOM) {
    comment = linkContext.comment = document.createComment('repeat end for ' + linkContext.prop);
    el.parentNode.insertBefore(linkContext.comment, el);
    el.remove();
    linkContext.$$elRemovedFromDOM = true;
  }

  function rebuild() {
    var docFragment = document.createDocumentFragment();
    each(lastLinks, function (link) {
      link.unlink();
    });

    lastLinks.length = 0;
    lastLinks = [];
    each(arr, function (itemData, index) {
      repeaterItem = makeOneClonedLinkerForRepeater(linkContext, itemData, index);
      lastLinks.push(repeaterItem.linker);
      docFragment.appendChild(repeaterItem.el);
    });

    comment.parentNode.insertBefore(docFragment, comment);
  }

  if (lastLinks.length > 0 && lastArrayChangeInfo) {
    var fn = lastArrayChangeInfo[0],
      itemData,
      _linker;
    switch (fn) {
      case 'push': {
        itemData = arr[arr.length - 1];
        repeaterItem = makeOneClonedLinkerForRepeater(linkContext, itemData, index);
        lastLinks.push(repeaterItem.linker);
        comment.parentNode.insertBefore(repeaterItem.el, comment);
        break;
      }
      case 'pop': {
        _linker = lastLinks.pop();
        _linker.unlink();
        break;
      }
      case 'removeOne': {
        var index = lastArrayChangeInfo[1];
        _linker = lastLinks.splice(index, 1)[0];
        _linker.unlink();
        break;
      }
      case 'unshift': {
        var firstLinkerEl = lastLinks[0].el;
        itemData = arr[0];
        repeaterItem = makeOneClonedLinkerForRepeater(linkContext, itemData, index);
        lastLinks.unshift(repeaterItem.linker);
        firstLinkerEl.parentNode.insertBefore(repeaterItem.el, firstLinkerEl);
        break;
      }
      case 'shift': {
        _linker = lastLinks.shift();
        _linker.unlink();
        break;
      }
      default: {
        // clear all and rebuild 
        rebuild();
      }
    }

  } else {
    rebuild();
  }

  linkContext.lastLinks = lastLinks;
}