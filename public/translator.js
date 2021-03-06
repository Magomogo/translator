/*global jQuery*/

function MuzzyTranslator(locale, options, dbDriver, deps) {
    "use strict";

    if (undefined === deps) {
        deps = {};
    }

    var options = options || {
            stickHandlersToClosestVisibleParent: true
        },
        di = deps.dialog || this.dialog(jQuery, locale, dbDriver),
        ks = deps.keysStorage || this.keysStorage(jQuery, options.stickHandlersToClosestVisibleParent),
        kf = deps.keysFinder || this.keysFinder(jQuery, ks),
        ha = deps.handler || this.handler(jQuery, di);

    return this.publicInterface(jQuery, di, kf, ks, ha);
}

MuzzyTranslator.prototype.dialog = function($, locale, dbDriver) {
    "use strict";

    function iframeInParent() {return $('#translate', parent.document); }
    function dialogContainer() {return $('#translateDialogContainer'); }
    function unknownTranslationNotice() {return $('#unknownTranslationNotice'); }
    function dialogForm() {return $('#translateDialogContainer form'); }

    function raiseIframe() {
        iframeInParent().attr({
            width : $(parent.document).outerWidth(),
            height : $(parent.document).outerHeight()
        }).css({
            position: 'absolute',
            zIndex: 5000,
            top: 0,
            left: 0
        }).show();
    }

    function textarea(name, value) {
        return $('<textarea/>').attr({type: 'text', name: name}).html(value);
    }

    function iTag(content) {
        return $('<i/>').html(content);
    }

    function readStringObjects(ids, doneCallback) {
        var o = {};

        $.each(
            ids,
            function(i, id) {
                dbDriver.readSingleTranslation(locale, id, function(data) {
                    o[id] = data;

                    if ($.map(o, function () { return 1;}).length === ids.length) {
                        doneCallback(filterUnknownTranslationsAndSortInIdsOrder(o, ids));
                    }
                });
            }
        );
    }

    function filterUnknownTranslationsAndSortInIdsOrder(o, sortedIds) {
        var filtered = {}, id, i;

        for (i=0; i<sortedIds.length; i++) {
            id = sortedIds[i];
            if (o.hasOwnProperty(id) && o[id].key) {
                filtered[id] = o[id];
            }
        }
        return filtered;
    }

    function drawNotice() {
        raiseIframe();
        dialogForm().empty();
        unknownTranslationNotice().dialog({
            title: 'Unknown translation',
            autoOpen: true,
            width: 600,
            close: function () {
                iframeInParent().hide();
            },
            position: ['center', $(parent.window).scrollTop() + $(parent.window).outerHeight() / 4],
            buttons: {
                "Close": function () {
                    $(this).dialog("close");
                }
            }

        });
    }

    function drawDialog(stringObjects, submitCallback) {
        raiseIframe();
        dialogForm().empty();

        $.each(
            stringObjects,
            function (key, str) {
                var div = $('<div/>');
                iTag(
                    'translation for <b>"'
                        + (str.namespace && str.namespace.length ? str.namespace.join('/') + ':' : '')
                        + str.key + '"</b>:'
                ).appendTo(div);
                textarea(
                    'translation_' + key,
                    str.translation || str.key
                ).appendTo(div);
                iTag('context description:').appendTo(div);
                textarea(
                    'description_' + key,
                    str.description || ''
                ).appendTo(div);
                div.appendTo(dialogForm());
            }
        );

        dialogForm()
            .unbind('.translate')
            .bind(
                'submit.translate',
                function () {
                    dialogContainer().dialog('close');
                    submitCallback($(this).serializeArray());
                }
            );

        dialogContainer().dialog({
            title: 'Translate to ' + locale,
            autoOpen: true,
            width: 600,
            close: function () {iframeInParent().hide(); },
            position: ['center', $(parent.window).scrollTop() + $(parent.window).outerHeight()/4],
            buttons: {
                "Ok": function () {
                    $(this).dialog("close");
                    submitCallback(dialogForm().serializeArray());
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        });
    }

    function writeTranslations(a) {
        var i, strings = {}, id, propertyName;
        for (i=0; i < a.length; i++) {
            id = a[i].name.split('_')[1];
            propertyName = a[i].name.split('_')[0];
            if (!strings[id]) {
                strings[id] = {};
            }
            strings[id][propertyName] = a[i].value;
        }
        for (id in strings) {
            if (strings.hasOwnProperty(id)) {
                dbDriver.updateSingleTranslation(
                    locale, id, strings[id].translation.replace(/\r/gm, ''), strings[id].description
                );
            }
        }
    }

    return {
        t: {
            readStringObjects: readStringObjects,
            writeTranslations: writeTranslations
        },

        popUp : function (keys) {
            var translate = this;
            this.t.readStringObjects(keys, function(o){
                if ($.map(o, function () { return 1;}).length) {
                    drawDialog(o, translate.t.writeTranslations);
                } else {
                    drawNotice();
                }
            });
        }
    };
};

MuzzyTranslator.prototype.keysFinder = function ($, keysStorage) {
    "use strict";

    var keyRegexp = /\u2018([^\u2019]{32})\u2019/gm;

    function everyTranslationInChildTextNodes(el, callback) {
        var i, match;

        if (el.childNodes.length > 0) {
            for (i = 0; i < el.childNodes.length; i += 1) {
                if (el.childNodes[i].nodeType === 3) {
                    while ((match = keyRegexp.exec(el.childNodes[i].textContent)) !== null) {
                        callback(el.childNodes[i], match[1]);
                    }
                }
            }
        }
    }

    function everyTranslationInAttributes(el, callback) {
        var i, match;

        for (i = 0; i < el.attributes.length; i += 1) {
            while ((match = keyRegexp.exec(el.attributes[i].value)) !== null) {
                callback(el.attributes[i], match[1]);
            }
        }
    }

    return {
        testElement: function (el) {
            everyTranslationInChildTextNodes(el, function(childNode, key) {
                keysStorage.register($(childNode).parent(), key);
            });
            everyTranslationInAttributes(el, function(attribute, key) {
                keysStorage.register($(el), key);
            });
        },
        removeMarkUp: function(el) {
            everyTranslationInChildTextNodes(el, function(childNode) {
                childNode.textContent = childNode.textContent
                    .replace(keyRegexp, '\u2019');
            });
            everyTranslationInAttributes(el, function(attribute, key) {
                attribute.value = attribute.value.replace(keyRegexp, '\u2019');
            });
        }
    };
};

MuzzyTranslator.prototype.keysStorage = function($, stickHandlersToClosestVisibleParent) {
    "use strict";

    var keys = [];

    function selectBestAnchorInDOM($el) {

        if ($el.is(':hidden')) {

            if (!$el.parents('body').length) {
                return $('body', parent.document);
            }

            if (stickHandlersToClosestVisibleParent) {
                $el = $el.closest(':visible');
            } else if ($el.parents('select').length) {
                return $el.closest('select');
            }
        }

        if ($el.is('li,th,td,dd,dl')) {
            var $span = $el.children('.__mlsHandlerAnchor');
            if (!$span.length) {
                $span = $('<span class="__mlsHandlerAnchor"/>');
                $el.append($span);
            }
            return $span;
        }

        return $el;
    }

    function elementHavingSameParentIndex(parent) {
        for (var i in keys) {
            if (keys.hasOwnProperty(i) && (keys[i].anchor.parentElement === parent)) {
                return i;
            }
        }
        return undefined;
    }

    return {
        register: function (el, key) {
            var $el = selectBestAnchorInDOM($(el)),
                i = elementHavingSameParentIndex($el.parent().get(0));

            if (i) {
                if (keys[i].keys.indexOf(key) === -1) {
                    keys[i].keys.push(key);
                }
            } else {
                keys.push(
                    {anchor: $el.get(0), keys: [key]}
                );
            }
        },
        keys: keys
    };
};

MuzzyTranslator.prototype.handler = function($, dialog) {
    "use strict";

    var translateHandleStyles = {
            position: 'absolute',
            display: 'inline',
            textDecoration: 'none',
            fontSize : '30px',
            color: 'red',
            padding: 0,
            margin: 0,
            border: 'none',
            zIndex: 100,
            fontWeight: 'normal',
            'float': 'none',
            opacity: 0.5
        };
    
    function handle(clickCallback) {
        return $('<a href="javascript:;"/>').attr({
                'class': '__mlsHandle',
                onclick: 'if(event)event.stopPropagation()'
            })
            .append('*')
            .bind('click.translate', clickCallback)
            .css(translateHandleStyles);
    }

    function dialogCallback(keys) {
        return function() {dialog.popUp(keys);};
    }

    return {
        install: function(anchor, keys) {
            $(anchor).before(
                handle(dialogCallback(keys))
            );
        }
    };
};

MuzzyTranslator.prototype.publicInterface = function ($, dialog, keysFinder, keysStorage, handler) {
    "use strict";

    function findTranslationKeys(kf) {
        $('*', parent.document).each(
            function () {
                kf.testElement(this);
            }
        );
    }

    function removeSpecialMarkUp(kf) {
        $('*', parent.document).each(
            function () {
                kf.removeMarkUp(this);
            }
        );
    }

    function attachHandlers(ks, ha) {
        $.each(ks.keys, function () {
            ha.install(this.anchor, this.keys);
        });
    }

    return {
        t: {
            dialog: dialog,
            keysFinder: keysFinder,
            keysStorage: keysStorage,
            handler: handler
        },

        bindEvents: function () {
            findTranslationKeys(this.t.keysFinder);
            removeSpecialMarkUp(this.t.keysFinder);
            attachHandlers(this.t.keysStorage, this.t.handler);
        }
    };
};