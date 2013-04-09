function ICUCompilerInterface($, dbDriver) {
    "use strict";

    function compileTranslations(o, mf) {
        var i, string, js = '', declaredNamespaces = {};

        for (i = 0; i < o.length; i++) {
            string = o[i];

            if (string.namespace.length && !declaredNamespaces[string.namespace.join('/')]) {
                js = js + 'g.i18n[\'' + string.namespace.join('/') + '\'] = {};\n';
                declaredNamespaces[string.namespace.join('/')] = 1;
            }

            js = js + 'g.i18n';

            if (string.namespace.length) {

                js = js + '[\'' + string.namespace.join('/') + '\']';
            }
            js = js + '[\'' + string.key + '\'] = '
                + mf.precompile(mf.parse(string.translation))
                + ';\n';
        }

        return  '(function(g){' + 'g.i18n = {};\n' + js + '})(window);';
    }

    return {
        fillLocalesSelectbox: function() {
            var that = this;
            dbDriver.listLocales(function(l) {
                var selectbox = $('#localeSelector'), i;
                selectbox.empty();
                for (i = 0; i < l.length; i++) {
                    $('<option>' + l[i] +  '</option>').appendTo(selectbox);
                }
                selectbox.change(function() {
                    that.compileResult(this.value, new MessageFormat(this.value.substr(0,2)));
                });
            })
        },
        compileResult: function(locale, mf) {
            dbDriver.readTranslations(locale, '', function(o) {
                $('#result').val(
                    compileTranslations(o, mf)
                );
            });
        }
    };
}