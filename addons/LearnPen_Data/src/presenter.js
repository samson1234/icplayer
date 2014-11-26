function AddonLearn_Pen_Data_create() {

    function getErrorObject(ec) { return { isValid: false, errorCode: ec }; }

    function getCorrectObject(val) { return { isValid: true, value: val }; }

    function getCurrentTime() {
        function fillZeros(val) {
            return (String(val).length === 1 ? '0' : '') + val;
        }

        var result = 'HH:MM:SS DD/MN/YYYY';

        var date = new Date();

        result.replace('HH', fillZeros(date.getHours()));
        result.replace('MM', fillZeros(date.getMinutes()));
        result.replace('SS', fillZeros(date.getSeconds()));

        result.replace('DD', fillZeros(date.getDate()));
        result.replace('MN', fillZeros(date.getMonth() + 1));
        result.replace('YYYY', date.getFullYear() + '');

        return result;
    }

    var presenter = function() {};

    presenter.data = {
        isLearnPenOn: false
    };

    presenter.hexToRGBA = function(hex, opacity) {
        var r = parseInt(hex.substring(1,3), 16),
            g = parseInt(hex.substring(3,5), 16),
            b = parseInt(hex.substring(5,7), 16);

        return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
    };

    function setVisibility(is_visible) {
        presenter.$view.css("visibility", is_visible ? "visible" : "hidden");
    }

    // TODO Sprawdzić czy dobrze wykrywa LearnPen'a
    function getDataFromSmartPen() {
        if (window.LearnPen) {
            presenter.data.isLearnPenOn = true;
            return {
                a: parseInt(window.LearnPen.getA(), 10),
                b: parseInt(window.LearnPen.getB(), 10),
                c: parseInt(window.LearnPen.getC(), 10),
                p: parseInt(window.LearnPen.getD(), 10)
            }
        }

        presenter.data.isLearnPenOn = false;
        return { a: 0, b: 0, c: 0, p: 0 };
    }

    presenter.setPlayerController = function (controller) {
        presenter.playerController = controller;
    };

    presenter.colorNameToHex = function(color) {
        var colors = {
            "aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
            "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff",
            "blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887","cadetblue":"#5f9ea0","chartreuse":"#7fff00",
            "chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c",
            "cyan":"#00ffff","darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9",
            "darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
            "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a",
            "darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
            "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969",
            "dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22",
            "fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520",
            "gray":"#808080","green":"#008000","greenyellow":"#adff2f","honeydew":"#f0fff0","hotpink":"#ff69b4",
            "indianred ":"#cd5c5c","indigo ":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa",
            "lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6",
            "lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2","lightgrey":"#d3d3d3",
            "lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa",
            "lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de","lightyellow":"#ffffe0",
            "lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000",
            "mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8",
            "mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a",
            "mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa",
            "mistyrose":"#ffe4e1","moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6",
            "olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
            "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093",
            "papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd",
            "powderblue":"#b0e0e6","purple":"#800080","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
            "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee",
            "sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090",
            "snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080",
            "thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3",
            "white":"#ffffff","whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd32"
        };

        if (typeof colors[color.toLowerCase()] !== 'undefined') {
            return colors[color.toLowerCase()];
        }

        return false;
    };

    presenter.MODE = {
        Pressure: "PRESSURE",
        Squeeze: "SQUEEZE",
        DEFAULT: "Pressure"
    };

    presenter.ERROR_CODES = {
        I01: 'Property icon cannot by empty',

        BGC01: 'Wrong color format in Background Color property',

        C01: 'Property Steps and Colors has to by 2 - 7 items long',
        C02: 'Wrong color format in Colors property',
        C03: 'Adjacent colors has to be different',

        T01: 'Property Refresh time cannot be lower then 50 and higher then 2000',
        T02: 'Property Refresh time has to be numeric'
    };

    function validateIcon(icon) {
        if (ModelValidationUtils.isStringEmpty(icon)) {
            return getErrorObject('I01');
        }

        return getCorrectObject(icon);
    }

    function validateColor(color) {
        if (color[0] === '#') {
            if (color.length !== 7 && color.length !== 4 || !/^#[0-9a-fA-F]+$/.test(color)) return false;
        } else {
            color = presenter.colorNameToHex(color);
            if (!color) return false;
        }

        return color;
    }

    function validateBGColor(color) {
        if (ModelValidationUtils.isStringEmpty(color)) {
            return getCorrectObject("#fff"); // white
        }

        color = validateColor(color);

        if (!color)
            return getErrorObject('BGC01');

        return getCorrectObject(color);
    }

    function validateColors(colors) {
        function areAdjacentElementsDifferent(colors) {
            for (var i=1; i<colors.length; i++)
                if (colors[i-1] === colors[i])
                    return false;

            return true;
        }

        if (ModelValidationUtils.isStringEmpty(colors)) {
            return getCorrectObject([ // default:
                '#c90707',            // red
                '#ff9305',            // orange
                '#ffdc08',            // yellow
                '#03c6ff',            // blue
                '#00dd2f'             // green
            ]);
        }

        colors = colors.split('\n');

        if (colors.length > 7 || colors.length < 2) {
            return getErrorObject('C01');
        }

        colors = colors.map(function(c) { return validateColor(c) });

        if (colors.indexOf(false) !== -1) {
            return getErrorObject('C02');
        }

        if (!areAdjacentElementsDifferent(colors)) {
            return getErrorObject('C03');
        }

        return getCorrectObject(colors);
    }

    function validateTime(time) {
        if (ModelValidationUtils.isStringEmpty(time)) {
            return getCorrectObject(1000);
        }

        if (!/^[0-9]+$/.test(time)) {
            return getErrorObject('T02');
        }

        time = parseInt(time, 10);

        if (time < 50 || time > 2000) {
            return getErrorObject('T01');
        }

        return getCorrectObject(time);
    }

    function createIcon(margin, iconSize) {
        function getBorderRadius(radius) {
            radius += 'px';
            return {
                "-webkit-border-radius": radius,
                "-moz-border-radius": radius,
                "border-radius": radius
            };
        }

        var $icon = presenter.$view.find('.icon');

        $icon.css(getBorderRadius(iconSize));

        $icon.css({
            "width": iconSize + "px",
            "height": iconSize + "px",

            "background-image": 'url(' + presenter.configuration.icon + ')',
            "background-repeat": "no-repeat",
            "background-size": "100% 100%",

            "margin": margin + "px",
            "border": "5px solid white"
//            "top": "-3px"
        });
    }

    function createSteps(margin, iconSize) {
        var $pie = presenter.$view.find('.icon');
        var $big = $pie.filter('.big');

        $pie.css({
            'position': 'absolute',
            'width': '200px',
            height: 400px;
            overflow: hidden;
            left: 200px;
            -moz-transform-origin: left center;
            -ms-transform-origin: left center;
            -o-transform-origin: left center;
            -webkit-transform-origin: left center;
            transform-origin: left center;
        });

        $big.css({
            width: 400px;
            height: 400px;
            left: 0;
            -moz-transform-origin: center center;
            -ms-transform-origin: center center;
            -o-transform-origin: center center;
            -webkit-transform-origin: center center;
            transform-origin: center center;
        });



        //presenter.configuration.colors;
    }

    function createGraph() {
        var MARGIN = parseInt(presenter.configuration.contentSize / 10, 10); // 10% of total size
        var ICON_SIZE = presenter.configuration.contentSize - (2 * MARGIN);

        createIcon(MARGIN, ICON_SIZE);

        createSteps(MARGIN, ICON_SIZE);
    }

    presenter.validateModel = function(model) {
        var validatedIcon = validateIcon(model.icon);
        if (!validatedIcon.isValid) return getErrorObject(validatedIcon.errorCode);

        var validatedBGColor = validateBGColor(model.backgroundColor);
        if (!validatedBGColor.isValid) return getErrorObject(validatedBGColor.errorCode);

        var validatedColors = validateColors(model.colors);
        if (!validatedColors.isValid) return getErrorObject(validatedColors.errorCode);

        var validatedTime = validateTime(model.refreshTime);
        if (!validatedTime.isValid) return getErrorObject(validatedTime.errorCode);

        var width = parseInt(model.Width, 10);
        var height = parseInt(model.Height, 10);

        return {
            isDisable: ModelValidationUtils.validateBoolean(model.isDisable),
            sensor: ModelValidationUtils.validateOption(presenter.MODE, model.sensor),
            icon: validatedIcon.value,
            backgroundColor: validatedBGColor.value,
            colors: validatedColors.value,
            refreshTime: validatedTime.value,
            contentSize: Math.min(width, height),

            id: model.ID,
            isVisible: ModelValidationUtils.validateBoolean(model["Is Visible"]),
            isValid: true
        };
    };

    presenter.presenterLogic = function(view, model, isPreview) {
        presenter.$view = $(view);

        presenter.configuration = presenter.validateModel(model);
        if (!presenter.configuration.isValid) {
            DOMOperationsUtils.showErrorMessage(view, presenter.ERROR_CODES, presenter.configuration.errorCode);
            return false;
        }

        createGraph();

        if (!isPreview && !presenter.configuration.isDisable) {

        }

        setVisibility(presenter.configuration.isVisible);
    };

    presenter.run = function(view, model) {
        presenter.presenterLogic(view, model, false);
    };

    presenter.createPreview = function(view, model) {
        presenter.presenterLogic(view, model, true);
    };

    presenter.executeCommand = function(name, params) {
        Commands.dispatch({
            'getHistory': presenter.getHistory
        }, name, params, presenter);
    };

    presenter.getHistory = function() {
        return {
            start: getCurrentTime(),
            values: [{}],
            end: getCurrentTime(),
            refreshTime: presenter.configuration.refreshTime
        };
    };

//    presenter.setShowErrorsMode = function() { };
//    presenter.setWorkMode = function() { };
//    presenter.reset = function() { };
//    presenter.getErrorCount = function() { return 0; };
//    presenter.getMaxScore = function() { return 0; };
//    presenter.getScore = function() { return 0; };
//    presenter.getState = function() { };
//    presenter.setState = function() { };

    return presenter;
}