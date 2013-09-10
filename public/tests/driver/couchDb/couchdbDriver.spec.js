describe('couchdbDriver', function() {

    var locale = 'de_CH',
        namespace = 'math',
        localizedStringObject = {
            _id: 'uuid-1234ac33',
            key: 'one',
            translation: 'Eins',
            namespace: ['math', 'numbers']
        };

    function mockedDriver(restMock) {
        return new MuzzyTranslatorCouchDbDriver({
            restInterface: restMock
        });
    }

    function callDriverMethodAndCatchRestUri(method, args) {
        var collectedGetUri,
            collectedPutUri,
            collectedDelUri,
            driverMethod = mockedDriver({
                get: function(uri){
                    collectedGetUri = uri;
                },
                put: function(uri, data){
                    collectedPutUri = uri;
                },
                del: function(uri){
                    collectedDelUri = uri;
                }
            })[method];

        driverMethod.apply(driverMethod, args);

        return {
            get : collectedGetUri,
            put : collectedPutUri,
            del : collectedDelUri
        };
    }

//--------------------------------------------------------------------------------------------------

    it('queries correct URI on reading translation object', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'readSingleTranslation',
                [locale, '1234567890']
            ).get
        ).toEqual('couchdb/de_ch/_design/main/_view/find?key="1234567890"');
    });

//--------------------------------------------------------------------------------------------------

    it ('calls correct view on reading page ids', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'readNamespaces',
                [locale]
            ).get
        ).toEqual('couchdb/de_ch/_design/main/_view/all_namespaces?group=true');
    });

    it ('calls correct view on reading page objects', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'readTranslations',
                [locale, namespace]
            ).get
        ).toEqual('couchdb/de_ch/_design/main/_view/translations?key="math"');
    });

//--------------------------------------------------------------------------------------------------

    it ('deletes locale', function() {
        expect(
            callDriverMethodAndCatchRestUri(
                'deleteTranslations',
                [locale]
            ).del
        ).toEqual('couchdb/de_ch');
    });

//--------------------------------------------------------------------------------------------------

    it ('reads localized string before writing translation', function() {
        var getUri, putUri;

        mockedDriver({
            get: function(uri, successCallback){
                getUri = uri;
                putUri = null;
                successCallback({rows: [ {value: localizedStringObject } ]});
            },
            put: function(uri, data){
                putUri = uri;
            }
        }).updateSingleTranslation(locale, 'e242ff', 'eins');

        expect(getUri).toEqual('couchdb/de_ch/_design/main/_view/find?key="e242ff"');
        expect(putUri).toEqual('couchdb/de_ch/uuid-1234ac33');
    });

//--------------------------------------------------------------------------------------------------

    it('calls success callback on reading page ids', function() {
        var spy = jasmine.createSpy();
        mockedDriver({
            get: function(url, successCallback){
                successCallback({rows:[]});
            }
        }).readNamespaces(locale, spy);
        expect(spy).toHaveBeenCalled();
    });

    it('calls success callback on reading page objects', function() {
        var spy = jasmine.createSpy();
        mockedDriver({
            get: function(url, successCallback){
                successCallback({rows:[]});
            }
        }).readTranslations(locale, namespace, spy);
        expect(spy).toHaveBeenCalled();
    });

    it('lists all locales stored in the database using regular expression', function(){
        var locales;

        runs(function() {
            mockedDriver({
                get: function(url, successCallback){
                    successCallback(["_users","ru_ru","i18n_test","ru","ttt"]);
                }
            }).listLocales(function(l) {
                locales = l;
            });
        });

        waitsFor(function() {
            return locales;
        });

        runs(function() {
            expect(locales).toEqual(['ru_ru']);
        })
    });

    it('writes string description into database', function() {
        var actualData = {};
        mockedDriver({
            get: function(uri, successCallback){
                successCallback({rows: [ {value: localizedStringObject } ]});
            },
            put: function(uri, data){
                actualData = data;
            }
        }).updateSingleTranslation(locale, 'e242ff', 'eins', 'A number');

        expect(actualData).toEqual({
            _id : 'uuid-1234ac33',
            key: 'one',
            translation: 'eins',
            description: 'A number',
            namespace: ['math', 'numbers']
        })

    });
});