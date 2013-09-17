/*global jQuery*/

function MuzzyTranslatorCouchDbDriver(deps) {
    "use strict";

    if (undefined === deps) {
        deps = {};
    }

    var ri = deps.restInterface || this.restInterface(jQuery);

    return this.translateInterface(jQuery, ri);
}

MuzzyTranslatorCouchDbDriver.prototype.restInterface = function ($) {
    "use strict";

    function request(o, successCallback, notFoundCallback) {
        $.ajax(
            $.extend({
                dataType: 'json',
                contentType: 'application/json',
                success: successCallback,
                statusCode: { 404: notFoundCallback }
            }, o)
        );
    }

    return {
        get: function (url, successCallback, notFoundCallback) {
            request({type: 'GET', url: url}, successCallback, notFoundCallback);
        },
        put: function (url, data, successCallback, notFoundCallback) {
            request({type: 'PUT', url: url, data: JSON.stringify(data)}, successCallback, notFoundCallback);
        },
        del: function (url, successCallback, notFoundCallback) {
            request({type: 'DELETE', url: url}, successCallback, notFoundCallback);
        }
    };
};

MuzzyTranslatorCouchDbDriver.prototype.translateInterface = function($, restInterface){
    "use strict";

    function localizedstringStringSchema(data){
        return $.extend(
            data,
            {
                key: data.key || '' ,
                translation: data.translation || null ,
                namespace: data.namespace || []
            }
        );
    }

    function createPath(locale, id) {
        return 'couchdb/' + encodeURIComponent(locale.toLowerCase()) +
                       '/' + encodeURIComponent(id);
    }

    function readLocalizedStringObject(locale, hash, successCallback) {
        restInterface.get(
            createPath(locale, '_design') + '/main/_view/find?key="' + hash + '"',
            function(data) {
                successCallback(localizedstringStringSchema(data.rows.length ? data.rows[0].value : {}));
            },
            function(){
                successCallback(localizedstringStringSchema({}));
            }
        );
    }

    return {
        t: {
            restInterface: restInterface
        },

        deleteTranslations: function (locale) {
            restInterface.del('couchdb/' + locale.toLowerCase());
        },
        updateSingleTranslation: function(locale, hash, translation, description) {
            readLocalizedStringObject(locale, hash, function(str){
                str.translation = translation;
                if (description) {
                    str.description = description;
                }
                restInterface.put(createPath(locale, str._id), str);
            });
        },
        readNamespaces: function(locale, successCallback) {
            restInterface.get(
                createPath(locale, '_design') + '/main/_view/all_namespaces?group=true',
                function(data) {
                    var namespaces=[], i;
                    for(i=0; i< data.rows.length; i++) {
                        namespaces.push(data.rows[i].key);
                    }
                    if (successCallback) successCallback(namespaces);
                }
            );
        },
        readTranslations: function(locale, namespace, successCallback) {
            restInterface.get(
                createPath(locale, '_design') + '/main/_view/translations?key="' + (namespace || '') + '"',
                function(data) {
                    var objects=[], i, o;
                    for (i=0; i< data.rows.length; i++) {
                        o = localizedstringStringSchema(data.rows[i].value);
                        objects.push(o);
                    }
                    if (successCallback) successCallback(objects);
                }
            );
        },
        readSingleTranslation: function(locale, hash, successCallback) {
            readLocalizedStringObject(locale, hash, successCallback);
        },
        listLocales: function(successCallback) {
            restInterface.get('couchdb/_all_dbs', function(data) {
                var i, locales = [];
                for (i=0; i < data.length; i++) {
                    if (data[i].match(/^[a-z]{2}_[a-z]{2}$/)) {
                        locales.push(data[i]);
                    }
                }
                successCallback(locales);
            });
        }
    };
};
