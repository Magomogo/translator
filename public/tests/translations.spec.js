describe('translations', function() {

    var dbDriverStub,
        localizedStringObject =  {
            key: 'one',
            translation: 'Eins',
            namespace: ['math', 'numbers']
        };

    function translations(driverStub) {
        dbDriverStub = driverStub;
        return new MuzzyTranslations('de_CH', driverStub);
    }

//--------------------------------------------------------------------------------------------------

    it('reads all translations on creating', function() {

        translations({readTranslations: jasmine.createSpy()});

        expect(dbDriverStub.readTranslations)
                .toHaveBeenCalledWith('de_CH', '', jasmine.any(Function));
    });

    it('translates a global key', function() {
        var result;

        result = translations({
            readTranslations: function(locale, ns, successCallback){
                successCallback([{key: 'one', 'translation': 'Eins', namespace: []}]);
            }
        }).translate('one');

        expect(result).toEqual('Eins');
    });

    it('translates a namespaced key', function() {
        var result;

        result = translations({
            readTranslations: function(locale, ns, successCallback){
                successCallback([{key: 'one', 'translation': 'Eins', namespace: ['math', 'numbers']}]);
            }
        }).translate('math/numbers:one');

        expect(result).toEqual('Eins');
    });

    it('returns passed key when no translation exists', function(){
        var result;

        result = translations({
            readTranslations: function(locale, ns, successCallback){
                successCallback([]);
            }
        }).translate('some/namespace:notExisting');

        expect(result).toEqual('notExisting');
    });

});
