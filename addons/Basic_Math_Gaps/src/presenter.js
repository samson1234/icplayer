function AddonBasic_Math_Gaps_create(){

    var presenter = function(){};

    presenter.eventBus = null;

    presenter.playerController = null;

    presenter.setPlayerController = function (controller) {
        this.playerController = controller;
    };

    presenter.createPreview = function(view, model){
        runLogic(view, model, true);
    };

    function createFraction(id, gapDef) {
        var container = $('<span class="fraction-container"></span>'),
            numerator = $('<span class="numerator"></span>'),
            denominator = $('<span class="denominator"></span>'),
            input = $('<input type="text" value="" id="' + id + '" />');

        if (presenter.configuration.isDisabled) {
            input.attr('disabled', 'disabled');
            input.addClass('disabled');
        }

        if (!gapDef.fraction.numerator.isGap && !gapDef.fraction.denominator.isGap && gapDef.isGap) {
            numerator.append($(input).clone().attr('id', input.attr('id') + '-numerator'));
            denominator.append($(input).clone().attr('id', input.attr('id') + '-denominator'));
        } else {

            if (gapDef.fraction.numerator.isGap) {
                numerator.append($(input).clone().attr('id', input.attr('id') + '-numerator'));
            } else {
                numerator.append($('<span class="element">' + gapDef.fraction.numerator.parsed + '</span>'));
            }

            if (gapDef.fraction.denominator.isGap) {
                denominator.append($(input).clone().attr('id', input.attr('id') + '-denominator'));
            } else {
                denominator.append($('<span class="element">' + gapDef.fraction.denominator.parsed + '</span>'));
            }

        }

        container.append(numerator).append(denominator);
        return container;
    }

    presenter.run = function(view, model){
        runLogic(view, model, false);
    };

    function runLogic(view, model, isPreview) {
        presenter.configuration = presenter.validateModel(model);

        if (presenter.configuration.isError) {
            DOMOperationsUtils.showErrorMessage($(view), presenter.errorCodes, presenter.configuration.errorCode);
        }

        presenter.$view = $(view);

        if (!presenter.configuration.isError) {
            displayGaps(model);
        }

        presenter.setVisibility(presenter.configuration.isVisible);


    }

    presenter.addFocusOutEventListener = function (isPreview) {
        if(!isPreview && !presenter.configuration.isDisabled) {
            presenter.eventBus = presenter.playerController.getEventBus();

            var inputs = presenter.$view.find('input');

            inputs.focusout(function() {
                var item = presenter.$view.find('input').index( this),
                    value = $(this).val(),
                    score = $(this).val() == presenter.configuration.gapsValues[item];

                if (presenter.configuration.isEquation && getNonEmptyInputs().length != presenter.$view.find('input').length ) { return; }
                presenter.sendEvent(item, value, score);
            });
        }
    };

    function displayGaps(model) {
        var container = presenter.$view.find('.basic-math-gaps-container'),
            hasFractions = false;

        $.each(presenter.configuration.gapsDefinition, function(i) {
            var id = model.ID + '-' + i;
            if (this.isFraction) {
                var fraction = createFraction(id, this);
                container.append(fraction);
                hasFractions = true;

            } else if (this.isGap) {
                var gap = $('<input type="text" value="" id="' + id + '" />');
                if (presenter.configuration.isDisabled) {
                    gap.attr('disabled', 'disabled');
                    gap.addClass('disabled');
                }
                container.append(gap);
            } else {
                var element = $('<span class="element">' + this.originalForm + '</span>');
                container.append(element);
            }
            if (this.isHiddenAdditionAfter) {
                container.append($('<span class="hidden-addition">+</span>'));
            }
        });

        if (hasFractions) {
            container.addClass('hasFractions');
        }
    }

    function escapeRegexSpecialCharacters(value) {
        return (value + '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex special characters
    }

    function convertDecimalSeparator(value, from, to) {
        if (from == '.') {
            return value;
        }
        var escaped = escapeRegexSpecialCharacters(from);
        return value.replace(new RegExp(escaped, 'g'), to);
    }

    function log(message) {
        console.log(message);
    }

    presenter.errorCodes = {
        'E01' : 'Left side is not equal to Right side.',
        'E02' : 'A space can NOT be a decimal separator.'
    };

    function getValueOfSingleElement(element, isGap, shouldParse) {
        var getGapValuePattern = /\[(.+)\]/,
            isDigitPattern = /\d+/;

        element = isGap ? getGapValuePattern.exec(element)[1] : element.replace(/[\[\]']+/g, '');

        if (isDigitPattern.test(element) && shouldParse) {
            return parseInt(element, 10);
        } else {
            return element;
        }
    }

    // this is for situation when user pass for example: 1 1/2,
    // which from math point of view is an addition but the addition sign should NOT be displayed
    function checkIsHiddenAddition(list, index) {
        var isDigitPattern = /\d+/;
        if ( index >= list.length ) {
            return false;
        }

        if ( isDigitPattern.test(list[index]) && isDigitPattern.test(list[index + 1]) ) {
            return true;
        }

        return false;
    }

    presenter.validateGapsDefinition = function(model, isEquation, separator) {
        var validatedGapsDefinition = [],
            isGapPattern = /^\[.+\]$/,
            splittedGapsBySpace = model['gapsDefinition'].split(' '),
            isFractionPattern = /\d+\]*\/\[*\d+/,
            leftSide = '',
            rightSide = '',
            isLeft = true,
            gapsValues = [];

        $.each(splittedGapsBySpace, function(i) {
            var value = splittedGapsBySpace[i],
                isGap = isGapPattern.test(value),
                isFraction = isFractionPattern.test(value),
                singleElement = {
                    originalForm: value,
                    isGap: isGap,
                    isFraction: isFraction,
                    parsed: getValueOfSingleElement(value, isGap, true),
                    notParsed: getValueOfSingleElement(value, isGap, false),
                    isHiddenAdditionAfter: checkIsHiddenAddition(splittedGapsBySpace, i)
                };
            if (isFraction) {
                var numerator = value.split('/')[0],
                    denominator = value.split('/')[1],
                    isNumeratorGap = isGapPattern.test(numerator),
                    isDenominatorGap = isGapPattern.test(denominator);

                if (!isGap) {
                    isNumeratorGap = isGapPattern.test(numerator),
                    isDenominatorGap = isGapPattern.test(denominator);
                } else {
                    isNumeratorGap = true;
                    isDenominatorGap = true;
                    numerator += ']';
                    denominator = '[' + denominator;
                }

                singleElement.fraction = {
                    numerator: {
                        isGap: isNumeratorGap,
                        originalForm: numerator,
                        parsed: getValueOfSingleElement(numerator, isNumeratorGap, true),
                        notParsed: getValueOfSingleElement(numerator, isNumeratorGap, false)
                    },
                    denominator: {
                        isGap: isDenominatorGap,
                        originalForm: denominator,
                        parsed: getValueOfSingleElement(denominator, isDenominatorGap, true),
                        notParsed: getValueOfSingleElement(denominator, isDenominatorGap, false)
                    }
                };

                if(isNumeratorGap) {
                    gapsValues.push(singleElement.fraction.numerator.notParsed);
                }

                if(isDenominatorGap) {
                    gapsValues.push(singleElement.fraction.denominator.notParsed);
                }

            } else if(singleElement.isGap) {
                gapsValues.push(singleElement.notParsed);
            }

            validatedGapsDefinition.push(singleElement);

            if (singleElement.notParsed == '=') {
                isLeft = false;
                return true; // continue in jQuery.each
            }

            if (isLeft) {
                leftSide += singleElement.notParsed;
                if (singleElement.isHiddenAdditionAfter) {
                    leftSide += '+';
                }
            } else {
                rightSide += singleElement.notParsed;
                if (singleElement.isHiddenAdditionAfter) {
                    rightSide += '+';
                }
            }
        });

        if (isEquation) {
            leftSide = convertDecimalSeparator(leftSide, separator, '.');
            rightSide = convertDecimalSeparator(rightSide, separator, '.');

            var leftSideEvaluated = eval(leftSide).toFixed(2),
                rightSideEvaluated = eval(rightSide).toFixed(2);

            if(leftSideEvaluated != rightSideEvaluated) {
                return {
                    'isError' : true,
                    'errorCode' : 'E01'
                }
            }

        }

        return {
            'isError' : false,
            'allElements' : validatedGapsDefinition,
            'gapsValues' : gapsValues,
            'leftSide' : isEquation ? leftSideEvaluated : leftSide,
            'rightSide' : isEquation ? rightSideEvaluated : rightSide
        }

    };

    function validateDecimalSeparator(separator) {
        var spacePattern = /s+/;

        if (spacePattern.test(separator)) {
            return {
                'isError' : true,
                'errorCode' : 'E02'
            }
        }

        return {
            'isError' : false,
            'value' : separator.length > 0 ? separator : '.'
        };
    }

    presenter.validateModel = function(model) {
        var validatedIsEquation = ModelValidationUtils.validateBoolean(model['isEquation']),
            validatedIsDisabled = ModelValidationUtils.validateBoolean(model['isDisabled']),
            validatedIsActivity = !(ModelValidationUtils.validateBoolean(model['isNotActivity'])),
            validatedIsVisible = ModelValidationUtils.validateBoolean(model['Is Visible']);

        var validatedDecimalSeparator = validateDecimalSeparator(model['decimalSeparator']);

        if (validatedDecimalSeparator.isError) {
            return {
                'isError' : true,
                'errorCode' : validatedDecimalSeparator.errorCode
            }
        }

        var validatedGapsDefinition = presenter.validateGapsDefinition(model, validatedIsEquation, validatedDecimalSeparator.value);

        if (validatedGapsDefinition.isError) {
            return {
                'isError' : true,
                'errorCode' : validatedGapsDefinition.errorCode
            }
        }

        return {
            'isError' : false,
            'gapsDefinition' : validatedGapsDefinition.allElements,
            'gapsValues' : validatedGapsDefinition.gapsValues,
            'isEquation' : validatedIsEquation,
            'addonID' : model.ID,
            'rightValue' : validatedGapsDefinition.rightSide,
            'leftValue' : validatedGapsDefinition.leftSide,
            'isActivity' : validatedIsActivity,
            'isDisabled' : validatedIsDisabled,
            'isVisibleByDefault' : validatedIsVisible,
            'isVisible' : validatedIsVisible,
            'decimalSeparator' : validatedDecimalSeparator.value
        }
    };

    presenter.setShowErrorsMode = function(){
        var inputs = presenter.$view.find('input');
        $.each(inputs, function() {
            $(this).attr('disabled', 'disabled');
            $(this).addClass('disabled');
        });

        if (canNOTCheckScore() || areInputsAllEmpty(inputs) || (presenter.configuration.isEquation && getNonEmptyInputs().length != presenter.$view.find('input').length)) {
            return;
        }

        var validated = validateScore();

        if (presenter.configuration.isEquation) {

            var container = presenter.$view.find('.basic-math-gaps-container');

            if (!validated.userExpressionValid) {
                $(container).addClass('wrong');
                return;
            }

            if ( !isEquationCorrect(validated) ) {
                $(container).addClass('wrong');
                return;
            }

            $(container).addClass('correct');

        } else {

            $.each(inputs, function(i) {
                var shouldBeValue = presenter.configuration.gapsValues[i],
                    currentValue = $(this).val();

                    if (shouldBeValue == currentValue) {
                        $(this).addClass('correct');
                    } else if (currentValue.length > 0) {
                        $(this).addClass('wrong');
                    }
            });

        }
    };

    presenter.setWorkMode = function(){
        if (presenter.configuration.isDisabled) {
            return;
        }
        var inputs = presenter.$view.find('input');
        inputs.attr('disabled', false);
        inputs.removeClass('correct wrong disabled');
        presenter.$view.find('.basic-math-gaps-container').removeClass('correct wrong');
    };

    presenter.reset = function(){
        if (presenter.configuration.isDisabled) {
            return;
        }
        var inputs = presenter.$view.find('input');
        inputs.attr('disabled', false);
        inputs.removeClass('correct wrong disabled');
        inputs.val('');
    };

    function isEquationCorrect(validatedScore) {
        return validatedScore.isSameResultOnBothSides
            && validatedScore.leftEvaluated == presenter.configuration.leftValue
            && validatedScore.rightEvaluated == presenter.configuration.rightValue;
    }

    presenter.getErrorCount = function(){
        if (canNOTCheckScore() || areInputsAllEmpty()) {
            return 0;
        }

        var validated = validateScore();

        if (presenter.configuration.isEquation) {
            if (!validated.userExpressionValid) {
                return 1;
            }

            if ( !isEquationCorrect(validated) ) {
                return 1;
            }

            return 0;
        } else {
            return getNonEmptyInputs().length - validated.validGapsCount;
        }

    };

    function getNonEmptyInputs() {
        var nonEmpty = $.grep(presenter.$view.find('input'), function(element) { return $(element).val().length > 0 });
        return nonEmpty;
    }

    presenter.getMaxScore = function(){
        if (presenter.configuration.isEquation && presenter.configuration.isActivity) {
            return 1;
        } else if (presenter.configuration.isActivity) {
            return presenter.$view.find('input').length;
        } else {
            return 0;
        }
    };

    function getUserExpression() {
        var result = '';

        $.each(presenter.$view.find('.basic-math-gaps-container').children(), function() {
            var elements = [$(this)];

            if (elements[0].hasClass('fraction-container')) {
                var container = elements[0];
                elements = [];
                elements.push(container.find('.numerator').children());
                elements.push($('<span class="element">/</span>'));
                elements.push(container.find('.denominator').children());
            }
            $.each(elements, function() {
                var element = $(this);
                if (element.is('input')) {
                    element = element.val();
                } else {
                    element = element.html();
                }
                result += convertDecimalSeparator(element, presenter.configuration.decimalSeparator, '.');
            });
        });

        return result;
    }

    function areInputsAllEmpty(inputs) {
        var allEmpty = true;

        if (inputs == undefined) {
            inputs = presenter.$view.find('input');
        }

        $.each(inputs, function() {
            if($(this).val().length > 0) {
                allEmpty = false;
            }
        });

        return allEmpty;
    }

    function validateScore() {
        var inputs = presenter.$view.find('input'),
            isValid = true,
            validGapsCount = 0;

        $.each(inputs, function(i) {
            var value = $(this).val();
            if ( presenter.configuration.gapsValues[i] != value ) {
                isValid = false;
            } else if (value.length > 0) {
                validGapsCount++;
            }
        });

        var userExpression = getUserExpression(),
            splitted = userExpression.split('='),
            userExpressionValid = false;

        if (presenter.configuration.isEquation && splitted.length > 1 && splitted[0].length > 0 && splitted[1].length > 0) {
            var userExpressionLeft = splitted[0],
                userExpressionRight = userExpression.split('=')[1],
                leftEvaluated = eval(userExpressionLeft).toFixed(2),
                rightEvaluated = eval(userExpressionRight).toFixed(2),
                isSameResultOnBothSides = leftEvaluated == rightEvaluated;

            userExpressionValid = true;
        }

        return {
            'userExpressionValid' : userExpressionValid,
            'isValid' : isValid,
            'isSameResultOnBothSides' : isSameResultOnBothSides,
            'leftEvaluated' : leftEvaluated,
            'rightEvaluated' : rightEvaluated,
            'validGapsCount' : validGapsCount
        }
    }

    function canNOTCheckScore() {
        return !presenter.configuration.isActivity || presenter.configuration.isDisabled;
    }

    presenter.getScore = function(){
        if ( canNOTCheckScore() || areInputsAllEmpty()) {
            return 0;
        }

        var validated = validateScore();

        if (presenter.configuration.isEquation) {

            if (!validated.userExpressionValid) {
                return 0;
            }

            if ( !isEquationCorrect(validated) ) {
                return 0;
            }

            return 1;

        } else {

            return validated.validGapsCount;

        }
    };

    function getValuesFromAllInputs() {
        var values = [];
        $.each(presenter.$view.find('input'), function() {
            values.push($(this).val());
        });
        return values;
    }

    function setValuesForAllInputs(values) {
        $.each(presenter.$view.find('input'), function(i) {
            $(this).val(values[i]);
        });
    }

    presenter.getState = function(){
        var state = {
            'values' : getValuesFromAllInputs(),
            'isVisible' : presenter.configuration.isVisible,
            'isDisabled' : presenter.configuration.isDisabled
        };
        return JSON.stringify(state);
    };

    presenter.setState = function(stateString){
        var state = JSON.parse(stateString);

        setValuesForAllInputs(state.values);
        presenter.configuration.isVisible = state.isVisible;
        presenter.configuration.isDisabled = state.isDisabled;

        presenter.setVisibility(state.isVisible);
    };

    presenter.show = function() {
        presenter.setVisibility(true);
        presenter.configuration.isVisible = true;
    };

    presenter.hide = function() {
        presenter.setVisibility(false);
        presenter.configuration.isVisible = false;
    };

    presenter.setVisibility = function(isVisible) {
        presenter.$view.css("visibility", isVisible ? "visible" : "hidden");
    };

    presenter.disable = function() {
        presenter.configuration.isDisabled = true;
        $.each(presenter.$view.find('input'), function(i) {
            $(this).attr('disabled', 'disabled');
            $(this).addClass('disabled');
        });
    };

    presenter.enable = function() {
        presenter.configuration.isDisabled = false;
        $.each(presenter.$view.find('input'), function(i) {
            $(this).attr('disabled', false);
            $(this).removeClass('disabled');
        });
    };

    presenter.isAllOK = function() {
        var score = presenter.getScore();
        return score == presenter.getMaxScore() && score != 0;
    };

    presenter.executeCommand = function(name, params) {
        var commands = {
            'show': presenter.show,
            'hide': presenter.hide,
            'disable' : presenter.disable,
            'enable' : presenter.enable,
            'isAllOK' : presenter.isAllOK,
            'getView' : presenter.getView
        };

        Commands.dispatch(commands, name, params, presenter);
    };

    presenter.getView = function() {
        return this.$view;
    };

    presenter.createEventData = function (item, value, score) {
        if (presenter.configuration.isEquation) {
            score = presenter.isAllOK() ? 1 : 0;
            value = '';
            item = 'all';
        } else {
            score = score ? 1 : 0;
            value.toString();
            item = (item + 1).toString();
        }

        return {
            'source': presenter.configuration.addonID,
            'item': item,
            'value': value,
            'score': score
        };
    };

    presenter.sendEvent = function(item, value, score) {
        var eventData = presenter.createEventData(item, value, score);
        presenter.eventBus.sendEvent('ValueChanged', eventData);

        if (presenter.isAllOK() && !presenter.configuration.isEquation) sendAllOKEvent();
    };

    function sendAllOKEvent() {
        var eventData = {
            'source': presenter.configuration.addonID,
            'item': 'all',
            'value': '',
            'score': ''
        };

        presenter.eventBus.sendEvent('ValueChanged', eventData);
    }

    return presenter;
}