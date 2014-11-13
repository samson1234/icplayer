TestCase("[Smart_Pen_Data] Auxiliary functions", {

    setUp: function() {
        this.presenter = AddonLearn_Pen_Data_create();
    },

    'test color name to hex' : function() {
        assertFalse(this.presenter.colorNameToHex("maka paka"));
        assertEquals('#ff0000', this.presenter.colorNameToHex("rEd"));
        assertEquals('#008000', this.presenter.colorNameToHex("greeN"));
        assertEquals('#0000ff', this.presenter.colorNameToHex("Blue"));
        assertEquals('#ff6347', this.presenter.colorNameToHex("toMATo"));
    },

    'test hex to RGBA' : function() {
        assertEquals('rgba(255,255,255,1)', this.presenter.hexToRGBA("#FFFFFF", 1));
        assertEquals('rgba(0,0,0,0.5)', this.presenter.hexToRGBA('#000000', 0.5));
        assertEquals('rgba(168,5,204,0)', this.presenter.hexToRGBA('#a805cc', 0));
        assertEquals('rgba(16,17,18,1)', this.presenter.hexToRGBA('#101112', 1));
    }

});