describe('keysFinder', function() {
    var sB = '\u2018',
        sE = '\u2019';

    function key() {
        return '37da8ec5debbe6961c1a955fbae79fb3';
    }

    function translation() {
        return 'Another simple string';
    }

    function tPair() {
        return sB + key() + sE + translation() + sE;
    }

    function domElement(html) {
        return jQuery('<div>' + html + '</div>').get(0);
    }

    function find(html) {
        var result = [],
            dom = jQuery('<div/>').append(domElement(html)),
            keysStorageMock = {
                register: function(parent, key){result.push(key);}
            },
            finder = new MuzzyTranslator('de', {}, {keysStorage: keysStorageMock}).t.keysFinder;

        jQuery('*', dom).each(
            function(){
                finder.testElement(this);
            }
        );
        return result;
    }

//--------------------------------------------------------------------------------------------------

    it('calls keysStorage for registering found key', function() {
        var storageMock = {
            register: jasmine.createSpy()
        };

        (new MuzzyTranslator('de', {}, {keysStorage: storageMock})).t.keysFinder.testElement(
            domElement(tPair())
        );

        expect(storageMock.register).toHaveBeenCalledWith(jasmine.any(Object), key());
    });

//--------------------------------------------------------------------------------------------------

    it('can find a translation in plain text node', function() {
        expect(find(tPair())).toEqual([key()]);
    });

    it('can find two translations in plain text node', function() {
        expect(find(tPair() + ' ' + tPair())).toEqual([key(), key()]);
    });

    it('can find a translations deep inside DOM structure', function() {
        expect(find('<div>ss<p>Paragraph <i>' + tPair() + '</i></p></div>')).toEqual([key()]);
    });

    it('can find a translation key inside attributes', function() {
        expect(find('<img alt="' + tPair() + '" title="' + tPair() + '">')).toEqual([key(), key()]);
    });

//--------------------------------------------------------------------------------------------------

    it('removes translation markUp from text node', function() {
        var el = domElement(tPair());

        (new MuzzyTranslator()).t.keysFinder.removeMarkUp(el);

        expect(el.innerHTML).toEqual(sE + translation() + sE);
    });

    it('removes translation markUp from attributes', function() {
        var el = domElement('<img alt="' + tPair() + '" title="' + tPair() + '">'),
            finder = new MuzzyTranslator('de').t.keysFinder;

        jQuery('*', el).each(
            function(){
                finder.removeMarkUp(this);
            }
        );

        expect(el.innerHTML).toEqual('<img alt="' + sE + translation() + sE + '" title="' + sE + translation() + sE + '">');
    });

    it('works with this particular string correctly', function() {
        var html = '<h5>‘60562ddb6d946ce45445fb8ca44d7bd1’Friburgo: una región, tres caras’</h5>',
            el = jQuery(html).get(0);

        (new MuzzyTranslator()).t.keysFinder.removeMarkUp(el);

        expect(el.innerHTML).toBe('’Friburgo: una región, tres caras’');
    });
});