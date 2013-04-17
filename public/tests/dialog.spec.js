describe('dialog', function() {

    beforeEach(function() {
        $('body').append($('<div id="translateDialogContainer"></div>'));
    });

    afterEach(function() {
        $('#translateDialogContainer').remove();
    });

//--------------------------------------------------------------------------------------------------

    it('reads multilanguage strings for every provided key', function() {
        var dialog = (new MuzzyTranslator('de_CH')).t.dialog;
        spyOn(dialog.t, 'readStringObjects');
        dialog.popUp(['123', '456']);
        expect(dialog.t.readStringObjects).toHaveBeenCalledWith(['123', '456'], jasmine.any(Function));
    });

    it('collects string objects array in one object', function() {
        var driver = {
                readSingleTranslation: function(locale, key, successCallback){
                    successCallback({key: key});
                }
            },
            dialog = (new MuzzyTranslator('de_CH', driver)).t.dialog;

        dialog.t.readStringObjects(['key1', 'key2'], function(o) {
            expect(o).toEqual({
                key1: {key: 'key1'},
                key2: {key: 'key2'}
            });
        });
    });

    it('writes dialog form data as translations', function() {
        var driver = {
                updateSingleTranslation: jasmine.createSpy()
            },
            dialog = (new MuzzyTranslator('de_CH', driver)).t.dialog;

        dialog.t.writeTranslations(
            [
                {name: 'translation_123456', value: 'translated'},
                {name: 'description_123456', value: 'context described'},
                {name: 'translation_45234', value: 'translated too'},
                {name: 'description_45234', value: 'another context'}
            ]
        );

        expect(driver.updateSingleTranslation).toHaveBeenCalledWith('de_CH', '123456', 'translated', 'context described');
        expect(driver.updateSingleTranslation).toHaveBeenCalledWith('de_CH', '45234', 'translated too', 'another context');
    });

    it('ignores unknown translations', function() {
        var driver = {
                readSingleTranslation: function(locale, id, successCallback){
                    if (id === 'id1') {
                        successCallback({});
                    } else {
                        successCallback({key: 'Something'});
                    }
                }
            },
            dialog = (new MuzzyTranslator('de_CH', driver)).t.dialog;

        dialog.t.readStringObjects(['id1', 'id2'], function(o) {
            expect(o).toEqual({
                id2: {key: 'Something'}
            });
        });
    });

    it('removes windows CR from translation', function() {
        var driver = {
                updateSingleTranslation: jasmine.createSpy()
            },
            dialog = (new MuzzyTranslator('nl_NL', driver)).t.dialog;

        dialog.t.writeTranslations(
            [{name: 'translation_8512ae7d57b1396273f76fe6ed341a23', value: "Taal\r\nhehe"}]
        );

        expect(driver.updateSingleTranslation).toHaveBeenCalledWith('nl_NL', '8512ae7d57b1396273f76fe6ed341a23', "Taal\nhehe", undefined);
    });
});