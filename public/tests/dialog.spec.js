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
            [{name: '123456', value: 'translated'},{name: '45234', value: 'translated too'}]
        );

        expect(driver.updateSingleTranslation).toHaveBeenCalledWith('de_CH', '123456', 'translated');
        expect(driver.updateSingleTranslation).toHaveBeenCalledWith('de_CH', '45234', 'translated too');
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
    })
});