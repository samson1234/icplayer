function Addoncrossword_create(){
    var presenter = function(){};

    presenter.rowCount         = null;
    presenter.columnCount      = null;
    presenter.cellHeight       = null;
    presenter.cellWidth        = null;
    presenter.maxScore         = null;
    presenter.score            = null;
    presenter.id               = null;
    presenter.blankCellsBorderStyle  = "solid";
    presenter.blankCellsBorderWidth  = 0;
    presenter.blankCellsBorderColor  = "transparent";
    presenter.letterCellsBorderStyle = "solid";
    presenter.letterCellsBorderWidth = 0;
    presenter.letterCellsBorderColor = "transparent";
    presenter.wordNumbersHorizontal = false;
    presenter.wordNumbersVertical = false;
    presenter.disableAutomaticWordNumbering = false;
    presenter.markedColumnIndex = 0;
    presenter.markedRowIndex = 0;

    presenter.ERROR_MESSAGES = {
        ROWS_NOT_SPECIFIED:                     "Amount of rows is not specified",
        COLUMNS_NOT_SPECIFIED:                  "Amount of columns is not specified",
        INVALID_MARKED_COLUMN_INDEX:            "Marked column index cannot be negative, use 0 to disable",
        INVALID_MARKED_ROW_INDEX:               "Marked row index cannot be negative, use 0 to disable",
        CELL_WIDTH_NOT_SPECIFIED:               "Cell width is not specified",
        CELL_HEIGHT_NOT_SPECIFIED:              "Cell height is not specified",
        INVALID_BLANK_CELLS_BORDER_WIDTH:       "Blank cells border width must be greater on equal to 0",
        INVALID_LETTER_CELLS_BORDER_WIDTH:      "Letter cells border width must be greater on equal to 0",
        INVALID_AMOUNT_OF_ROWS_IN_CROSSWORD:    "Amount of lines (that act as rows) in the specified Crossword is different that amount of rows you have specified in Properties",
        INVALID_AMOUNT_OF_COLUMNS_IN_CROSSWORD: "Amount of characters (that act as columns) in row %row% of specified Crossword is different that amount of columns you have specified in Properties"
    };

    presenter.VALIDATION_MODE = {
        COUNT_SCORE: 0,
        SHOW_ERRORS: 1
    };

    presenter.showErrorMessage = function(message, substitutions) {
        var errorContainer;
        if(typeof(substitutions) == 'undefined') {
            errorContainer = '<p>' + message + '</p>';
        } else {
            var messageSubst = message;
            for(var key in substitutions) {
                messageSubst = messageSubst.replace('%' + key + '%', substitutions[key]);
            }
            errorContainer = '<p>' + messageSubst + '</p>';
        }

        presenter.$view.html(errorContainer);
    };


    presenter.prepareGrid = function(model) {
        presenter.tabIndexBase = ($("div.crossword_container").length * 5000) + 5000;
        presenter.maxScore = 0;
        presenter.crossword = [];

        var rows = model['Crossword'].split("\n");
        for(var i = 0; i < presenter.rowCount; i++) {
            var r = [];

            for(var j = 0; j < presenter.columnCount; j++) {
                r.push(rows[i][j].toUpperCase());
            }

            presenter.crossword.push(r);
        }
    };


    presenter.isHorizontalWordBegin = function(i, j) {
        if(!presenter.wordNumbersHorizontal)
            return false;

        return (
            // Skip empty cells
            presenter.crossword[i][j] != ' ' &&

                // We don't have a letter on the left
                (j === 0 ||  presenter.crossword[i][j-1] == ' ') &&

                // We do have a letter on the right
                (presenter.columnCount > j+1 && presenter.crossword[i][j+1] != ' '));
    };

    presenter.isVerticalWordBegin = function(i, j) {
        if(!presenter.wordNumbersVertical)
            return false;

        return (
            // Skip empty cells
            presenter.crossword[i][j] != ' ' &&

                // We don't have a letter above
                (i === 0 ||  presenter.crossword[i-1][j] == ' ') &&

                // We do have a letter below
                (presenter.rowCount > i+1 && presenter.crossword[i+1][j] != ' '));
    };

    presenter.onCellInputKeyUp = function(event) {
        // Allow: backspace, delete, tab, shift and escape
        if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 16 ||
            // Allow:  dot
            (event.keyCode == 190) ||
            // Allow: Ctrl+A
            (event.keyCode == 65 && event.ctrlKey === true) ||
            // Allow: home, end, left, right
            (event.keyCode >= 35 && event.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }

        event.target.value = event.target.value.toUpperCase();
    };

    presenter.onCellInputFocus = function(event){
        event.target.select();
    };

    presenter.onCellInputMouseUp = function(event){
        event.preventDefault();
    };

    presenter.createGrid = function() {
        var wordNumberCounter = 1;

        var gridContainer = $('<div class="crossword_container"></div>');
        gridContainer
            .css({ width:      presenter.columnCount * presenter.cellWidth + 'px',
                height:     presenter.rowCount * presenter.cellHeight + 'px',
                marginLeft: -1 * Math.round(presenter.columnCount * presenter.cellWidth / 2) + 'px',
                marginTop:  -1 * Math.round(presenter.rowCount * presenter.cellHeight / 2) + 'px' });

        var tabIndexOffset = 0;
        for(var i = 0; i < presenter.rowCount; i++) {
            for(var j = 0; j < presenter.columnCount; j++) {
                var cellContainer = $('<div class="cell_container"></div>');
                cellContainer.css({ width:  presenter.cellWidth + 'px',
                    height: presenter.cellHeight + 'px' });

                var cell = $('<div class="cell"></div>')
                    .addClass('cell_' + i + 'x' + j)
                    .addClass('cell_row_' + i)
                    .addClass('cell_column_' + j);

                if(presenter.markedRowIndex > 0 && presenter.markedRowIndex == i+1) {
                    cell.addClass('cell_row_marked');
                }

                if(presenter.markedColumnIndex > 0 && presenter.markedColumnIndex == j+1) {
                    cell.addClass('cell_column_marked');
                }

                cellContainer.append(cell);

                if(presenter.crossword[i][j] == ' ') {
                    cell.addClass('cell_blank');
                    cellContainer.addClass('cell_container_blank');

                } else {
                    cell.addClass('cell_letter');
                    cellContainer.addClass('cell_container_letter');

                    var input = $('<input type="text" maxlength="1" />')
                        .attr('tabIndex', presenter.tabIndexBase + tabIndexOffset++)
                        .keyup(presenter.onCellInputKeyUp)
                        .focus(presenter.onCellInputFocus)
                        .mouseup(presenter.onCellInputMouseUp);

                    if(presenter.preview)
                        input.attr({ value    : presenter.crossword[i][j].toUpperCase(),
                            disabled : true });



                    cell.append(input);

                    var horizontalWordBegin = presenter.isHorizontalWordBegin(i, j);
                    var verticalWordBegin = presenter.isVerticalWordBegin(i, j);


                    if(horizontalWordBegin || verticalWordBegin) {
                        presenter.maxScore++;

                        cell.addClass('cell_word_begin');

                        if(horizontalWordBegin)
                            cell.addClass('cell_word_begin_horizontal');

                        if(verticalWordBegin)
                            cell.addClass('cell_word_begin_vertical');

                        if(!presenter.disableAutomaticWordNumbering) {
                            var wordNumber = $('<div class="word_number"></div>').html(wordNumberCounter++);

                            cell.append(wordNumber);
                        }

                    }
                }

                // Cell borders
                var borderStyle;
                var borderWidth;
                var borderColor;

                if(presenter.crossword[i][j] != ' ') {
                    borderStyle = presenter.letterCellsBorderStyle;
                    borderWidth = presenter.letterCellsBorderWidth;
                    borderColor = presenter.letterCellsBorderColor;

                } else {
                    borderStyle = presenter.blankCellsBorderStyle;
                    borderWidth = presenter.blankCellsBorderWidth;
                    borderColor = presenter.blankCellsBorderColor;
                }

                if(i === 0 || presenter.crossword[i-1][j] == ' ') { // Outer top border
                    cell.css({ borderTopStyle: borderStyle,
                        borderTopWidth: (borderWidth * 2) + 'px',
                        borderTopColor: borderColor,
                        top:            (borderWidth * -1) + 'px' });
                } else { // Inner top border
                    cell.css({ borderTopStyle: borderStyle,
                        borderTopWidth: borderWidth + 'px',
                        borderTopColor: borderColor });
                }


                if(i === presenter.rowCount - 1 || presenter.crossword[i+1][j] == ' ') { // Outer bottom border
                    cell.css({ borderBottomStyle: borderStyle,
                        borderBottomWidth: (borderWidth * 2) + 'px',
                        borderBottomColor: borderColor,
                        bottom:            (borderWidth * -1) + 'px' });
                } else { // Inner bottom border
                    cell.css({ borderBottomStyle: borderStyle,
                        borderBottomWidth: borderWidth + 'px',
                        borderBottomColor: borderColor });
                }


                if(j === 0 || presenter.crossword[i][j-1] == ' ') { // Outer left border
                    cell.css({ borderLeftStyle: borderStyle,
                        borderLeftWidth: (borderWidth * 2) + 'px',
                        borderLeftColor: borderColor,
                        left:            (borderWidth * -1) + 'px' });
                } else { // Inner left border
                    cell.css({ borderLeftStyle: borderStyle,
                        borderLeftWidth: borderWidth + 'px',
                        borderLeftColor: borderColor });
                }


                if(j === presenter.columnCount - 1 || presenter.crossword[i][j+1] == ' ') { // Outer right border
                    cell.css({ borderRightStyle: borderStyle,
                        borderRightWidth: (borderWidth * 2) + 'px',
                        borderRightColor: borderColor,
                        right:            (borderWidth * -1) + 'px' });
                } else { // Inner right border
                    cell.css({ borderRightStyle: borderStyle,
                        borderRightWidth: borderWidth + 'px',
                        borderRightColor: borderColor });
                }




                // Additional classes
                if(j == 0) {
                    cell.addClass('cell_first_in_row');
                } else if(j == presenter.columnCount - 1) {
                    cell.addClass('cell_last_in_row');
                }

                if(i == 0) {
                    cell.addClass('cell_first_in_column');
                } else if(i == presenter.rowCount - 1) {
                    cell.addClass('cell_last_in_column');
                }




                gridContainer.append(cellContainer);
            }
        }


        presenter.$view.append(gridContainer);

    };


    presenter.readConfiguration = function(model) {
        if(typeof(model['Blank cells border color']) != "undefined" && model['Blank cells border color'] !== "")
            presenter.blankCellsBorderColor = model['Blank cells border color'];

        if(typeof(model['Blank cells border width']) != "undefined" && model['Blank cells border width'] !== "")
            presenter.blankCellsBorderWidth = parseInt(model['Blank cells border width']);

        if(typeof(model['Blank cells border style']) != "undefined" && model['Blank cells border style'] !== "")
            presenter.blankCellsBorderStyle = model['Blank cells border style'];

        if(typeof(model['Letter cells border color']) != "undefined" && model['Letter cells border color'] !== "")
            presenter.letterCellsBorderColor = model['Letter cells border color'];

        if(typeof(model['Letter cells border width']) != "undefined" && model['Letter cells border width'] !== "")
            presenter.letterCellsBorderWidth = parseInt(model['Letter cells border width']);

        if(typeof(model['Letter cells border style']) != "undefined" && model['Letter cells border style'] !== "")
            presenter.letterCellsBorderStyle = model['Letter cells border style'];

        if(typeof(model['Word numbers']) != "undefined") {
            if(model['Word numbers'] == "horizontal" || model['Word numbers'] == "both" || model['Word numbers'] === "")
                presenter.wordNumbersHorizontal = true;

            if(model['Word numbers'] == "vertical" || model['Word numbers'] == "both" || model['Word numbers'] === "")
                presenter.wordNumbersVertical = true;
        }

        if(typeof(model['Marked column index']) != "undefined" && model['Marked column index'] !== "") {
            presenter.markedColumnIndex = parseInt(model['Marked column index']);
            if(presenter.markedColumnIndex < 0) {
                return {
                    isError: true,
                    errorMessage: presenter.ERROR_MESSAGES.INVALID_MARKED_COLUMN_INDEX
                };
            }
        }

        if(typeof(model['Marked row index']) != "undefined" && model['Marked row index'] !== "") {
            presenter.markedRowIndex = parseInt(model['Marked row index']);
            if(presenter.markedRowIndex < 0) {
                return {
                    isError: true,
                    errorMessage: presenter.ERROR_MESSAGES.INVALID_MARKED_ROW_INDEX
                };
            }
        }


        presenter.disableAutomaticWordNumbering = model['Disable automatic word numberin'] == 'True';

        if(presenter.blankCellsBorderWidth < 0) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.INVALID_BLANK_CELLS_BORDER_WIDTH
            };
        }

        if(presenter.letterCellsBorderWidth < 0) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.INVALID_LETTER_CELLS_BORDER_WIDTH
            };
        }

        if(parseInt(model['Columns']) <= 0 || isNaN(parseInt(model['Columns'])) ) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.COLUMNS_NOT_SPECIFIED
            };
        }

        if(parseInt(model['Rows']) <= 0 || isNaN(parseInt(model['Rows']))) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.ROWS_NOT_SPECIFIED
            };
        }

        if(parseInt(model['Cell width']) <= 0 || isNaN(parseInt(model['Cell width'])) ) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.CELL_WIDTH_NOT_SPECIFIED
            };
        }

        if(parseInt(model['Cell height']) <= 0 || isNaN(parseInt(model['Cell height']))) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.CELL_HEIGHT_NOT_SPECIFIED
            };
        }

        presenter.rowCount        = parseInt(model['Rows']);
        presenter.columnCount     = parseInt(model['Columns']);
        presenter.cellWidth       = parseInt(model['Cell width']);
        presenter.cellHeight      = parseInt(model['Cell height']);

        var rows = model['Crossword'].split("\n");
        if(rows.length != presenter.rowCount) {
            return {
                isError: true,
                errorMessage: presenter.ERROR_MESSAGES.INVALID_AMOUNT_OF_ROWS_IN_CROSSWORD
            };
        }

        for(var i = 0; i < rows.length; i++) {
            if(rows[i].length != presenter.columnCount) {
                return {
                    isError: true,
                    errorMessage: presenter.ERROR_MESSAGES.INVALID_AMOUNT_OF_COLUMNS_IN_CROSSWORD,
                    errorMessageSubstitutions: { row : i + 1 }
                };
            }
        }

        return {
            isError: false
        };
    };


    presenter.initializeLogic = function(view, model) {
        presenter.$view = $(view);
        presenter.shouldCalcScore = false;

        var configuration = presenter.readConfiguration(model);
        if(configuration.isError) {
            presenter.showErrorMessage(configuration.errorMessage, configuration.errorMessageSubstitutions);
        } else {
            presenter.prepareGrid(model);
            presenter.createGrid();
        }

    };


    presenter.validate = function(mode) {
        var wordValid, i, j, k, l, score, markedCell;

        if(mode == presenter.VALIDATION_MODE.SHOW_ERRORS) {
            presenter.$view.find(".cell_letter input").attr('disabled', true);
        } else if(mode == presenter.VALIDATION_MODE.COUNT_SCORE) {
            score = 0;
        }

        for(i = 0; i < presenter.rowCount; i++) {
            for(j = 0; j < presenter.columnCount; j++) {
                if(presenter.isHorizontalWordBegin(i, j)) {
                    wordValid = true;

                    for(k = j; k < presenter.columnCount; k++) {
                        if(presenter.crossword[i][k] == ' ') {
                            break;
                        }

                        if(presenter.crossword[i][k] != presenter.$view.find('.cell_' + i + 'x' + k + " input").attr('value')) {
                            wordValid = false;
                        }
                    }

                    if(mode == presenter.VALIDATION_MODE.COUNT_SCORE && wordValid) {
                        score++;
                    }

                    if(mode == presenter.VALIDATION_MODE.SHOW_ERRORS) {
                        for(l = j; l < k; l++) {
                            markedCell = presenter.$view.find('.cell_' + i + 'x' + l);
                            if(!markedCell.hasClass('cell_valid'))
                                markedCell.addClass('cell_' + (wordValid ? 'valid' : 'invalid'));

                            if(wordValid && markedCell.hasClass('cell_invalid'))
                                markedCell.removeClass('cell_invalid');

                        }
                    }
                }

                if(presenter.isVerticalWordBegin(i, j)) {
                    wordValid = true;

                    for(k = i; k < presenter.rowCount; k++) {
                        if(presenter.crossword[k][j] == ' ') {
                            break;
                        }

                        if(presenter.crossword[k][j] != presenter.$view.find('.cell_' + k + 'x' + j + " input").attr('value')) {
                            wordValid = false;
                        }
                    }

                    if(mode == presenter.VALIDATION_MODE.COUNT_SCORE && wordValid) {
                        score++;
                    }

                    if(mode == presenter.VALIDATION_MODE.SHOW_ERRORS) {
                        for(l = i; l < k; l++) {
                            markedCell = presenter.$view.find('.cell_' + l + 'x' + j);
                            if(!markedCell.hasClass('cell_valid'))
                                markedCell.addClass('cell_' + (wordValid ? 'valid' : 'invalid'));

                            if(wordValid && markedCell.hasClass('cell_invalid'))
                                markedCell.removeClass('cell_invalid');

                        }
                    }
                }

            }
        }

        if(mode == presenter.VALIDATION_MODE.COUNT_SCORE) {
            return score;
        }
    };

    presenter.setShowErrorsMode = function() {
        presenter.shouldCalcScore = true;
        presenter.validate(presenter.VALIDATION_MODE.SHOW_ERRORS);
    };


    presenter.setWorkMode = function() {
        presenter.$view.find(".cell_letter input").attr('disabled', false);
        presenter.$view.find(".cell_valid").removeClass("cell_valid");
        presenter.$view.find(".cell_invalid").removeClass("cell_invalid");
    };

    presenter.run = function(view, model) {
        presenter.preview = false;
        presenter.initializeLogic(view, model);
    };

    presenter.createPreview = function(view, model) {
        presenter.preview = true;
        presenter.initializeLogic(view, model);
    };

    presenter.reset = function() {
        presenter.shouldCalcScore = true;
        presenter.$view.find(".cell_letter input").attr('value', '');
        presenter.setWorkMode();
    };

    function isAnyCellFilled () {
        var isAnyCellFilled = false;

        jQuery.each(presenter.$view.find('.cell input'), function () {
            if (!ModelValidationUtils.isStringEmpty($(this).val())) {
                isAnyCellFilled = true;
                return false;
            }

            return true;
        });

        return isAnyCellFilled;
    }

    function shouldCalcScore () {
        // Addon should return score only if user makes some interaction (via Check/Reset buttons) or fills any of cells
        return presenter.shouldCalcScore || isAnyCellFilled();
    }

    presenter.getScore = function() {
        var score = presenter.validate(presenter.VALIDATION_MODE.COUNT_SCORE);

        return shouldCalcScore() ? score : 0;
    };

    presenter.getMaxScore = function() {
        return presenter.maxScore;
    };

    presenter.getErrorCount = function() {
        var score = presenter.validate(presenter.VALIDATION_MODE.COUNT_SCORE),
            errorCount = presenter.getMaxScore() - score;

        return shouldCalcScore() ? errorCount : 0;
    };

    presenter.getState = function() {
        var s = [];
        var cell;

        for(var i = 0; i < presenter.rowCount; i++) {
            for(var j = 0; j < presenter.columnCount; j++) {
                cell = presenter.$view.find('.cell_' + i + 'x' + j + ' input').attr('value');
                if(typeof(cell) == "string")
                    cell = cell.replace("\"", "\\\"");

                s.push(cell);
            }
        }

        return "[\"" + s.join("\",\"") + "\"]";
    };

    presenter.setState = function(state) {
        var s = $.parseJSON(state.toString());
        var counter = 0;

        for(var i = 0; i < presenter.rowCount; i++) {
            for(var j = 0; j < presenter.columnCount; j++) {
                presenter.$view.find('.cell_' + i + 'x' + j + ' input').attr('value', s[counter]);
                counter++;
            }
        }
    };


    return presenter;
}