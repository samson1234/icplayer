TestCase("[Smart_Pen_Data] Model validation", {

    setUp: function() {
        this.presenter = AddonLearn_Pen_Data_create();

        this.model = {
            ID: "Learn_Pen_Data1",
            "Is Visible": "True",
            isDisable: "",
            sensor: "",
            icon: "/file/serve/6171575946575872",
            backgroundColor: "",
            colors: "",
            refreshTime: ""
        };
    },

    'test proper model': function() {
        var validatedModel = this.presenter.validateModel(this.model);

        assertEquals("Learn_Pen_Data1", validatedModel.id);
        assertTrue(validatedModel.isVisible);
        assertFalse(validatedModel.isDisable);
        assertEquals("PRESSURE", validatedModel.sensor);
        assertEquals("/file/serve/6171575946575872", validatedModel.icon);
        assertEquals("#fff", validatedModel.backgroundColor);
        assertEquals(['#c90707','#ff9305','#ffdc08','#03c6ff','#00dd2f'], validatedModel.colors);
        assertEquals(1000, validatedModel.refreshTime);
    },

    'test empty icon property': function() {
        this.model.icon = "";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("I01", validatedModel.errorCode);
    },

    'test wrong background color 1': function() {
        this.model.backgroundColor = "#12345";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("BGC01", validatedModel.errorCode);
    },

    'test wrong background color 2': function() {
        this.model.backgroundColor = "#1234567";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("BGC01", validatedModel.errorCode);
    },

    'test wrong background color 3': function() {
        this.model.backgroundColor = "maka paka color";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("BGC01", validatedModel.errorCode);
    },

    'test too many colors': function() {
        this.model.colors = "red\ngreen\nblue\npink\nyellow\ngrey\nblack\nwhite";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("C01", validatedModel.errorCode);
    },

    'test too not enough colors': function() {
        this.model.colors = "red";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("C01", validatedModel.errorCode);
    },

    'test empty line colors': function() {
        this.model.colors = "red\n\n";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("C02", validatedModel.errorCode);
    },

    'test colors with wrong color format 1': function() {
        this.model.colors = "red\ngreen\n#12345";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("C02", validatedModel.errorCode);
    },

    'test colors with wrong color format 2': function() {
        this.model.colors = "red\ngreen\n#12345";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("C02", validatedModel.errorCode);
    },

    'test colors with wrong color format 3': function() {
        this.model.colors = "red\ngreen\n#12345";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("C02", validatedModel.errorCode);
    },

    'test refresh time below 50': function() {
        this.model.refreshTime = "2001";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("T01", validatedModel.errorCode);
    },

    'test refresh time over 2000': function() {
        this.model.refreshTime = "49";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("T01", validatedModel.errorCode);
    },

    'test non-numeric refresh time property': function() {
        this.model.refreshTime = "numerek 100";
        var validatedModel = this.presenter.validateModel(this.model);

        assertFalse(validatedModel.isValid);
        assertEquals("T02", validatedModel.errorCode);
    }

});