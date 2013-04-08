function MuzzyTranslations(locale, dbDriver) {
    "use strict";

    var translations;

    dbDriver.readTranslations(locale, '', function(arr) {
        var i;
        translations={};
        for(i=0; i< arr.length; i++) {
            if (translations[arr[i].namespace.join('/')] === undefined) {
                translations[arr[i].namespace.join('/')] = {};
            }

            translations[arr[i].namespace.join('/')][arr[i].key] = arr[i].translation;
        }
    });

    return {
        translate: function(keyWithNamespace) {
            if (keyWithNamespace.indexOf(':') === -1) {
                keyWithNamespace = ':' + keyWithNamespace;
            }
            var namespace = keyWithNamespace.split(':')[0],
                key = keyWithNamespace.split(':')[1];

            return (translations[namespace] || {key : key})[key] || key;
        }
    };
}