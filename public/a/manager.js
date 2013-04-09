/*global jQuery*/

function MuzzyTranslationsManager(locale, dbDriver) {
    "use strict";

    var $ = jQuery;

    function optionEl(value, displayed) {
        return $('<option/>').attr({value: value}).append(displayed);
    }

    function stringControl(id, key, translation) {
        return $('<dl/>').append(
            $('<dt/>').append(key)
        ).append(
            $('<dd/>').append(
                $('<textarea/>')
                    .attr({name: id})
                    .html(translation)
                    .bind('keydown', function () {
                        $(this).siblings('input').show();
                    })
            ).append(
                $('<input/>')
                    .attr({type: 'button', value: 'save'}).css({display: 'none'})
                    .bind('click', function () {
                        dbDriver.updateSingleTranslation(locale, id, $(this).siblings('textarea').val());
                        $(this).hide();
                    })
            )
        );
    }

    return {
        loadPageList: function ($el, $translationsContainer) {
            var manager = this;
            dbDriver.readNamespaces(
                locale,
                function (data) {
                    var i;
                    $el.append($('<option/>'));
                    for (i = 0; i < data.length; i++) {
                        $el.append(optionEl(data[i], data[i]));
                    }
                    $el.bind('change', function () {
                        manager.translationsList(this.value, $translationsContainer);
                    });
                }
            );
        },
        translationsList: function (namespace, c) {
            var ul = $('<ul/>').appendTo(c.empty());
            dbDriver.readTranslations(locale, namespace, function (data) {
                var i;
                for (i = 0; i < data.length; i++) {
                    ul.append(
                        stringControl(
                            data[i].id,
                            data[i].key,
                            data[i].translation
                        )
                    );
                }
            });
        }
    };
}