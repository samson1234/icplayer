function AddonWritingCalculations_create() {
    var presenter = function () {};

    presenter.$view = null;
    presenter.model = null;
    presenter.correctAnswersList = [];
    presenter.array = [];
    presenter.playerController = null;

    presenter.ELEMENT_TYPE = {
        "NUMBER" : 1,
        "EMPTY_BOX" : 2,
        "SYMBOL" : 3,
        "EMPTY_SPACE" : 4,
        "LINE" : 5,
        "DOT" : 6
    };

    presenter.upgradeModel = function (model) {
        return presenter.upgradeSigns(model);
    };

    presenter.upgradeSigns = function (model) {
        if ('Signs' in model) return model;

        var upgradedModel = {};
        $.extend(true, upgradedModel, model); // Deep copy of model object
        upgradedModel['Signs'] = [{
            'Addition' : '',
            'Subtraction' : '',
            'Division' : '',
            'Multiplication' : ''
        }];
        return upgradedModel;
    };

    presenter.ERROR_MESSAGES = {
        "OUT_OF_RANGE" : "Number between brackets must be from 0 to 9"
    };

    presenter.run = function(view, model) {
        presenterLogic(view, model);
        eventBus = presenter.playerController.getEventBus();
		eventBus.addEventListener('ShowAnswers', this);
        eventBus.addEventListener('HideAnswers', this);
    };

    presenter.createPreview = function(view, model) {
        presenterLogic(view, model);
    };

    function presenterLogic(view, model) {
        presenter.array = presenter.convertStringToArray(model.Value);
        presenter.$view = $(view);
        presenter.model = presenter.upgradeModel(model);
        presenter.signs = presenter.readSigns( presenter.model['Signs'][0] );
        presenter.createView(presenter.array);
        presenter.bindValueChangeEvent();
        presenter.setContainerWidth();
        presenter.addAdditionalStyles();
    }

    presenter.readSigns = function( signs ) {
        var properSigns = {};
        for ( var key in signs ) {
            if ( signs.hasOwnProperty(key) ) {
                if ( signs[key] == '' || signs[key] == '<br>' ) {
                    properSigns[key] = presenter.useDefaultSign( key );
                } else {
                    properSigns[key] = signs[key];
                }
            }
        }
        return properSigns;
    };

    presenter.useDefaultSign = function( key ) {
        if (key == 'Addition') {
            return "\\(+\\)";
        }
        if (key == 'Subtraction') {
            return "\\(-\\)";
        }
        if (key == 'Division') {
            return "\\(\\big)\\)";
        }
        if (key == 'Multiplication') {
            return "\\(\\times\\)";
        }
    };

    presenter.addAdditionalStyleToElement = function (row, column, style, clazz) {
        var rowElement = presenter.$view.find('.row-' + row),
            cellElement = rowElement.find('.cell-' + column);

        cellElement.addClass(clazz);
        cellElement.attr('style', style);
    };

    presenter.addAdditionalStyles = function() {
        if (!presenter.model['Styles']) {
            return;
        }
        $.each(presenter.model['Styles'], function() {
            var columns = this['Column'],
                rows = this['Row'];

            if (rows) {
                rows = rows.split(',');
            }

            if (columns) {
                columns = columns.split(',');
            }

            for (var row = 0; row < rows.length; row++) {
                for (var column = 0; column < columns.length; column++) {
                    presenter.addAdditionalStyleToElement(rows[row], columns[column], this['Style'], this['Class']);
                }
            }
        });
    };

    presenter.setContainerWidth = function() {
        var viewWrapper = this.$view.find("#writing-calculations-wrapper");
        var width = $(viewWrapper).children().outerWidth();
        $(viewWrapper).css('width', width);
    };

    presenter.bindValueChangeEvent = function() {
        presenter.$view.find(".writing-calculations-input").on('click', function(event) {
            event.stopPropagation();
        });

        presenter.$view.find(".writing-calculations-input").on("change", function(event){
            event.stopPropagation();

            var value = event.target.value;
            var rowIndex = $(event.target).attr("row");
            var cellIndex = $(event.target).attr("cell");
            var item = rowIndex + "-" + cellIndex;
            var isCorrect = 0;
            var answer = presenter.createAnswer(rowIndex, cellIndex, value);
            if(presenter.isCorrect(answer)) {
                isCorrect = 1;
            }

            presenter.triggerValueChangeEvent(value, item, isCorrect);
            if(presenter.allAnswersCorrect()) {
                presenter.triggerValueChangeEvent("", "all", "");
            }
        });
    };

    presenter.createView = function(convertedArray) {
        var viewWrapper = this.$view.find("#writing-calculations-wrapper"), columnItemIndex = 0;

        for(var rowIndex = 0; rowIndex < convertedArray.length; rowIndex++) {
            var rowWrapper = this.createRowWrapper(rowIndex),
                cellIndex = 0;

            columnItemIndex = 0;

            for(var index = 0; index < convertedArray[rowIndex].length; index++) {
                var element, row = convertedArray[rowIndex],
                    isGap = row[index] == '[';

                if( isGap ) {
                    element = row.slice(index, index + 3);
                    presenter.verifyElementRange(element);
                    var correctAnswer = {
                        rowIndex: rowIndex + 1,
                        cellIndex: ++columnItemIndex,
                        value: this.getValueOfElement(element)
                    };
                    this.correctAnswersList.push(correctAnswer);
                    index += 2;
                } else {
                    element = row[index];
                }
                var elementType = this.getElementType(element);

                var createdElement = this.createElement(element, elementType);
                if (elementType != presenter.ELEMENT_TYPE.LINE) {
                    addCellClass(createdElement, cellIndex);
                }

                this.transformElement(createdElement, element, elementType);

                if ( elementType == this.ELEMENT_TYPE.EMPTY_BOX ) {
                    this.addPosition(createdElement, correctAnswer);
                }

                rowWrapper.append(createdElement);

                if (elementType != this.ELEMENT_TYPE.DOT) {
                    cellIndex++;
                }
            }

            viewWrapper.append(rowWrapper);
        }
    };

    function addCellClass(createdElement, cellIndex) {
        $(createdElement).addClass('cell-' + (cellIndex + 1));
    }

    presenter.verifyElementRange = function(element) {
        if( element[2] != ']' ) {
            return this.$view.html(this.ERROR_MESSAGES.OUT_OF_RANGE);
        }
    };

    presenter.addPosition = function(element, position) {
        var input = $(element).find(".writing-calculations-input")[0];
        $(input).attr({
            "row" : position.rowIndex,
            "cell" : position.cellIndex
        });
    };

    presenter.getValueOfElement = function(element) {
        if( !this.isEmptyBox(element) ) {
            return;
        }
        var pattern = /[\d.,]/g;
        var value = element.match(pattern)[0];
        if( this.isInteger(value) ) {
            value = parseInt(value, 10);
        }
        return value;
    };

    presenter.createRowWrapper = function(index) {
        var rowWrapper = $("<div></div>");
        rowWrapper.addClass("wrapper-row row-" + (index + 1));
        return rowWrapper;
    };

    presenter.createElement = function(value, type) {
        var createdElement;
        switch(type) {
            case this.ELEMENT_TYPE.NUMBER:
                createdElement = this.createWrapperAndContainer("number");
                break;
            case this.ELEMENT_TYPE.SYMBOL:
                createdElement = this.createWrapperAndContainer("symbol");
                break;
            case this.ELEMENT_TYPE.EMPTY_SPACE:
                createdElement = this.createWrapperAndContainer("emptySpace", 'wrapper-empty-space');
                break;
            case this.ELEMENT_TYPE.EMPTY_BOX:
                createdElement = this.createWrapperAndContainer("emptyBox");
                break;
            case this.ELEMENT_TYPE.LINE:
                createdElement = this.createWrapperAndContainer("line", 'wrapper-line');
                break;
            case this.ELEMENT_TYPE.DOT:
                createdElement = this.createWrapperAndContainer("dot", 'wrapper-dot');
                break;
        }

        return createdElement;
    };

    presenter.createWrapperAndContainer = function(cssClass, wrapperClass) {
        if (!wrapperClass || wrapperClass === undefined) {
            wrapperClass = "wrapper-cell";
        }
        var wrapper = $("<div></div>");
        wrapper.addClass(wrapperClass);
        var container = $("<div></div>");
        container.addClass("container-" + cssClass);
        wrapper.append(container);
        return wrapper;
    };

    presenter.transformElement = function(element, value, type) {
        var container = $(element).find("[class*=container]");
        switch(type) {
            case this.ELEMENT_TYPE.EMPTY_SPACE:
                break;
            case this.ELEMENT_TYPE.EMPTY_BOX:
                var input = $("<input type='text'>");
                input.addClass("writing-calculations-input");
                container.append(input);
                break;
            case this.ELEMENT_TYPE.LINE:
                break;
            case this.ELEMENT_TYPE.SYMBOL:
                container.html(this.convertLaTeX(value));
                break;
            case this.ELEMENT_TYPE.DOT:
                container.html(value);
                break;
            default:
                container.html(value);
        }

    };

    presenter.convertLaTeX = function (value) {
        if (value === "*") {
            return presenter.signs['Multiplication'];
        }
        else if (value === ":" || value === ")") {
            return presenter.signs['Division'];
        }
        else if (value === "+") {
            return presenter.signs['Addition'];
        } else if (value === "-") {
            return presenter.signs['Subtraction'];
        }
    };

    presenter.getElementType = function(element) {
        if( this.isInteger(element) ) return this.ELEMENT_TYPE.NUMBER;
        if( this.isSymbol(element) ) return this.ELEMENT_TYPE.SYMBOL;
        if( this.isEmptySpace(element) ) return this.ELEMENT_TYPE.EMPTY_SPACE;
        if( this.isEmptyBox(element) ) return this.ELEMENT_TYPE.EMPTY_BOX;
        if( this.isLine(element) ) return this.ELEMENT_TYPE.LINE;
        if( this.isDot(element)) return this.ELEMENT_TYPE.DOT;
    };

    presenter.isDot = function(element) {
        return element == "." || element == ",";
    };

    presenter.isEmptyBox = function(element) {
        var pattern = /\[[\d.,]?\]/g; // matches: '[number]' or '[.]' or '[,]'
        return pattern.test(element);
    };

    presenter.isEmptySpace = function(element) {
        return element == "_";
    };

    presenter.isSymbol = function(element) {
        var pattern = /[+\-*:\)]/g; // matches: '+', '-', ':', ')' and '*'
        return pattern.test(element);
    };

    presenter.isInteger = function(element) {
        return element % 1 === 0 && element !== null && /\d/.test(element);
    };

    presenter.isLine = function(element) {
        return element == "=";
    };

    presenter.convertStringToArray = function(stringToConvert) {
        return stringToConvert.split(/[\n\r]+/);
    };

    presenter.isCorrect = function(answer) {
        var result = false;
        var correctAnswers = this.correctAnswersList;
        for(var i = 0; i < correctAnswers.length; i++) {
            if( this.isEqual(answer, correctAnswers[i]) ) {
                result = true;
            }
        }
        return result;
    };

    presenter.allAnswersCorrect = function() {
        var maxScore = presenter.getPoints("all");
        var score = presenter.getPoints("correct");
        var errorCount = presenter.getPoints("incorrect");

        return maxScore === score && errorCount === 0;
    };

    presenter.isEqual = function(answer, correctAnswer) {
        return answer.value === correctAnswer.value && answer.rowIndex === correctAnswer.rowIndex && answer.cellIndex === correctAnswer.cellIndex;
    };

    presenter.setShowErrorsMode = function() {
        var inputs = $(this.$view).find(".writing-calculations-input");
        
        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        $.each(inputs, function(){
            var answer = presenter.createAnswer($(this).attr("row"), $(this).attr("cell"), $(this).val());

            if (ModelValidationUtils.isStringEmpty($(this).val())) {
                presenter.markEmpty($(this));
            } else if( presenter.isCorrect(answer) ) {
                presenter.markCorrect($(this));
            } else {
                presenter.markIncorrect($(this));
            }
        });
    };

    presenter.createAnswer = function(row, cell, value) {
        var answer = {
            rowIndex: parseInt(row, 10),
            cellIndex: parseInt(cell, 10)
        };

        if( this.isInteger(value) ) {
            value = parseInt(value, 10);
        }

        answer.value = value;
        return answer;
    };

    presenter.markIncorrect = function(element) {
        presenter.markAs(element, "incorrect");
    };

    presenter.markCorrect = function(element) {
        presenter.markAs(element, "correct");
    };

    presenter.markEmpty = function(element) {
        presenter.markAs(element, "empty");
    };

    presenter.markAs = function(element, className) {
        $(element).addClass(className);
        $(element).attr("disabled", "disabled");
    };

    presenter.setWorkMode = function() {
        this.clean(true, false);
    };

    presenter.reset = function() {
        this.clean(true, true);
        var inputs = $(this.$view).find(".writing-calculations-input");
        if(typeof(presenter.userAnswers) !== "undefined") {
            $.each(inputs, function(index){
                presenter.userAnswers[index] = '';
            });	
        }
    };

    presenter.clean = function(removeMarks, removeValues) {
        var inputs = $(this.$view).find(".writing-calculations-input");
        $.each(inputs, function(){
            if(removeMarks) {
                presenter.removeMark($(this));
            }
            if(removeValues) {
                presenter.removeValue($(this));
            }
        });
    };

    presenter.removeMark = function(element) {
        $(element).removeClass("incorrect correct empty");
        $(element).removeAttr("disabled");
    };

    presenter.removeValue = function(element) {
        $(element).val("");
    };


    presenter.getInputsData = function() {
        var inputs = $(this.$view).find(".writing-calculations-input");
        var inputsData = {
            values : [],
            correctAnswersCount : 0,
            incorrectAnswersCount : 0
        };

        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        $.each(inputs, function () {
            var value = $(this).val();
            if (presenter.isInteger(value)) {
                value = parseInt(value, 10);
            }
            inputsData.values.push(value);

            if (value === undefined || value === "") return true; // jQuery.each continue

            var answer = presenter.createAnswer($(this).attr("row"), $(this).attr("cell"), $(this).val());
            if( presenter.isCorrect(answer) ) {
                inputsData.correctAnswersCount++;
            } else {
                inputsData.incorrectAnswersCount++;
            }
        });
        return inputsData;
    };

    presenter.getState = function() {
        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        return JSON.stringify({
            "inputsData" : this.getInputsData()
        });
    };

    presenter.setState = function(stateString) {
        if (ModelValidationUtils.isStringEmpty(stateString)) return;

        var state = JSON.parse(stateString);
        if (state.inputsData) {
            var inputs = $(this.$view).find(".writing-calculations-input");
            var inputsData = state.inputsData;
            $.each(inputs, function(index){
                $(this).val(inputsData.values[index]);
            });
        }
    };

    presenter.getScore = function() {
        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        return this.getPoints("correct");
    };

    presenter.getMaxScore = function() {
        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        return this.getPoints("all");
    };

    presenter.getErrorCount = function() {
        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        return this.getPoints("incorrect");
    };

    presenter.getPoints = function(type) {
        var inputsData = this.getInputsData();
        switch (type) {
            case 'correct':
                return inputsData.correctAnswersCount;
            case 'incorrect':
                return inputsData.incorrectAnswersCount;
            case 'all':
                return inputsData.values.length;
            default:
                return 0;
        }
    };


    presenter.createEventData = function(value, item, isCorrect) {
        return {
            source : this.model.ID,
            item : "" + item,
            value : "" + value,
            score : "" + isCorrect
        };
    };

    presenter.triggerValueChangeEvent = function(value, item, isCorrect) {
        var eventData = this.createEventData(value, item, isCorrect);
        if (this.playerController !== null) {
            this.playerController.getEventBus().sendEvent('ValueChanged', eventData);
        }
    };

    presenter.setPlayerController = function(controller) {
        this.playerController = controller;
    };

    presenter.onEventReceived = function (eventName) {
        if (eventName == "ShowAnswers") {
            presenter.showAnswers();
        }

        if (eventName == "HideAnswers") {
            presenter.hideAnswers();
        }
    };
    
    
    presenter.showAnswers = function () {
        if (presenter.isShowAnswersActive) {
            presenter.hideAnswers();
        }
        presenter.userAnswers = [];
        presenter.isShowAnswersActive = true;
        presenter.clean(true,false);
        var inputs = $(this.$view).find(".writing-calculations-input");
        var correctAnswers = this.correctAnswersList;
        
        $.each(inputs, function(index){
            $(this).addClass('writing-calculations_show-answers');
            $(this).attr("disabled", true);
            presenter.userAnswers.push($(this).val());
            $(this).val(correctAnswers[index].value);
        });
    };
    
    presenter.hideAnswers = function () {
        presenter.isShowAnswersActive = false;
        var inputs = $(this.$view).find(".writing-calculations-input");
        $.each(inputs, function(index){
            $(this).val(presenter.userAnswers[index]);
            $(this).removeClass('writing-calculations_show-answers');
            $(this).attr("disabled", false);
        });
    };
    
    return presenter;
}