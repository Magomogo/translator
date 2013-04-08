describe('couchdbDriver', function() {

    var locale = 'de_CH',
        namespace = 'math',
        localizedStringObject = {
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
        ).toEqual('couchdb/de_ch/1234567890');
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
        ).toEqual('couchdb/de_ch/_design/main/_view/by_namespace?key="math"');
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
                successCallback(localizedStringObject);
            },
            put: function(uri, data){
                putUri = uri;
            }
        }).updateSingleTranslation(locale, 'e242ff', 'eins');

        expect(getUri).toEqual('couchdb/de_ch/e242ff');
        expect(putUri).toEqual('couchdb/de_ch/e242ff');
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

});