function AddonText_Selection_create() {

	var presenter = function(){};

	var first = 0,
		lastMoveEvent = null;

	function isLastSpecialSigh(word) {
		return ['.', ',', '?', '!', ';', ':'].indexOf(word[word.length-1]) != -1;
	}

	presenter.isStartedCorrect = function(word) {
		return word.substr(0, 9) === "\\correct{";
	}

	presenter.isStartedWrong = function(word) {
		return word.substr(0, 7) === "\\wrong{";
	}

	presenter.hasClosingBracket = function(word) {
		return word[word.length-1] === '}' || word[word.length-2] === '}';
	}

	presenter.isMarkedCorrect = function(word) {
		return (/^\\correct{.*}/).test(word);
	};

	presenter.isMarkedWrong = function(word) {
		return (/^\\wrong{.*}/).test(word);
	};

	presenter.cutMarkedCorrect = function(word) {
		if(isLastSpecialSigh(word)) return word.slice(9, -2);
		return word.slice(9, -1);
	};

	presenter.cutMarkedWrong = function(word) {
		if(isLastSpecialSigh(word)) return word.slice(7, -2);
		return word.slice(7, -1);
	};

	presenter.startSelection = function(et) {
		first = parseInt($(et).attr('number'), 10);
		if (isNaN(first)) first = parseInt($(et).attr('left'), 10);
		if (isNaN(first)) first = presenter.$view.find('.text_selection').find('span').last().attr('number');
	}

	presenter.endSelection = function(et) {
		var last = parseInt($(et).attr('number'), 10),
			tmp = 0;

		if (isNaN(last)) last = parseInt($(et).attr('right'), 10);
		if (isNaN(last)) {
			var span = presenter.$view.find('.text_selection').find("span[number='" + first + "']");
			if(span.hasClass('selectable')) {
				span.toggleClass('selected');
			}
		}

		if(first !== last) {
			if(first > last) {
				tmp = first; first = last; last = tmp;
			}

			if(presenter.configuration.selection_type === 'SINGLESELECT') {
				if (presenter.$view.find('.selected').length === 0) {
					presenter.$view.find("span[number='" + first + "']").addClass('selected');
				} else if (presenter.$view.find('.selected').attr("number") === presenter.$view.find("span[number='" + first + "']").attr("number")) {
					$(this).removeClass('selected');
				} else {
					presenter.$view.find('.selected').removeClass('selected');
					$(this).addClass('selected');
				}
			} else if(presenter.configuration.selection_type === 'MULTISELECT') {
				for(var i=first; i<last+1; i++) {
					var element = presenter.$view.find('.text_selection').find("span[number='" + i + "']");
					if(element.hasClass('selectable')) {
						element.addClass('selected');
					}
				}
			}

			first = 0;

			if (window.getSelection) {
				window.getSelection().removeAllRanges();
			} else if (document.selection) {
				document.selection.empty();
			}
		}
	}

	presenter.turnOnEventListeners = function() {
		var $text_selection = presenter.$view.find('.text_selection');

		$text_selection.on('mouseup', function(e) {
			presenter.configuration.isExerciseStarted = true;
			presenter.endSelection(e.target);
		});

		$text_selection.on('mousedown', function(e) {
			presenter.startSelection(e.target);
		});

		$text_selection.find('.selectable').on('click', function() {
			presenter.configuration.isExerciseStarted = true;
			if(presenter.configuration.selection_type === 'SINGLESELECT') {
				if($text_selection.find('.selected').attr("number") === $(this).attr("number")) {
					$(this).removeClass('selected');
				} else {
					$text_selection.find('.selected').removeClass('selected');
					$(this).addClass('selected');
				}
			} else if(presenter.configuration.selection_type === 'MULTISELECT') {
				$(this).toggleClass('selected');
			}
		});

		$text_selection.on('touchstart', function(e) {
			e.preventDefault();
			presenter.startSelection(e.target);
		});

		$text_selection.on('touchend', function(e) {
			presenter.configuration.isExerciseStarted = true;
			e.preventDefault();
			presenter.endSelection(lastMoveEvent);
			lastMoveEvent = null;
		});

		$text_selection.on('touchmove', function(e) {
			e.preventDefault();
			var temp = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0] || e.originalEvent.targetTouches[0];

			lastMoveEvent = $(document.elementFromPoint(temp.pageX - $(document).scrollLeft(), temp.pageY - $(document).scrollTop()));
		});

		$text_selection.find('.selectable').hover(
			function() {
				$(this).addClass("hover");
			},
			function() {
				$(this).removeClass("hover");
			}
		);
	};

	presenter.turnOffEventListeners = function() {
		var $text_selection = presenter.$view.find('.text_selection');

		$text_selection.off('mouseup, mousedown, touchstart, touchend, touchmove');
		$text_selection.find('.selectable').off('click');
		$text_selection.find('.selectable').off('mouseenter mouseleave');
	};

	function getSelectableSpan(i, word) {
		return $('<span></span>').attr('number', i).addClass('selectable').html(word);
	}

	function getBlock(i, length, specialSign) {
		return i === length-1 ? specialSign + "" : "<span left='" + i + "' right='" + (i+1) + "'>" + specialSign + " </span>";
	}

	function getSpecialSign(word) {
		return isLastSpecialSigh(word) && (presenter.isMarkedWrong(word) || presenter.isMarkedCorrect(word)) ? word[word.length - 1] : "";
	}

	presenter.presenterLogic = function(view, model, isPreview) {
		presenter.$view = $(view);
		
		var i,
			markedCorrect = [],
			markedWrong = [],
			$res = $("<div class='text_selection'></div>"),
			$span;

		presenter.configuration = presenter.validateModel(model);
		if (!presenter.configuration.isValid) {
			DOMOperationsUtils.showErrorMessage(view, presenter.ERROR_CODES, presenter.configuration.errorCode);
			return;
		}

		var mode  = presenter.configuration.mode,
			words = presenter.configuration.words;

		if (mode === 'MARK_PHRASES') {
			for (i=0; i<words.length; i++) {
				if (presenter.isMarkedWrong(words[i])) {
					if(isPreview) {
						$span = $('<span></span>').attr('number', i).addClass('wrong').addClass('selectable').html(presenter.cutMarkedWrong(words[i]));
					} else {
						$span = getSelectableSpan(i, presenter.cutMarkedWrong(words[i]));
					}
					
					$res.append($span);
					$res.append(getBlock(i, words.length, getSpecialSign(words[i])));
					
					markedWrong.push(parseInt(i, 10));
				} else if (presenter.isMarkedCorrect(words[i])) {
					if(isPreview) {
						$span = $('<span></span>').attr('number', i).addClass('correct').addClass('selectable').html(presenter.cutMarkedCorrect(words[i]));
					} else {
						$span = getSelectableSpan(i, presenter.cutMarkedCorrect(words[i]));
					}
					
					$res.append($span);
					$res.append(getBlock(i, words.length, getSpecialSign(words[i])));
					
					markedCorrect.push(parseInt(i, 10));
				} else {
					if(isPreview) {
						$res.append(words[i] + getSpecialSign(words[i]) + ' ');
					} else {
						$span = $('<span></span>').attr('number', i).html(words[i]);
						$res.append($span);
						$res.append(getBlock(i, words.length, getSpecialSign(words[i])));
					}
				}
			}
		} else if (mode === 'ALL_SELECTABLE') {
			for (i=0; i<words.length; i++) {
				if (presenter.isMarkedCorrect(words[i])) {
					if(isPreview) {
						$span = $('<span></span>').attr('number', i).addClass('correct').addClass('selectable').html(presenter.cutMarkedCorrect(words[i]));
						$res.append($span);
						$res.append(getBlock(i, words.length, getSpecialSign(words[i])) + ' ');
					} else {
						$span = getSelectableSpan(i, presenter.cutMarkedCorrect(words[i]));
						$res.append($span);
						$res.append(getBlock(i, words.length, getSpecialSign(words[i])));
					}
					markedCorrect.push(parseInt(i, 10));
				} else {
					if(isPreview) {
						$span = getSelectableSpan(i, words[i]);
						$res.append($span);
						$res.append(getBlock(i, words.length, getSpecialSign(words[i])) + ' ');
					} else {
						$span = getSelectableSpan(i, words[i]);
						$res.append($span);
						$res.append(getBlock(i, words.length, getSpecialSign(words[i])));
					}

				}
			}
		}

		if(!isPreview) {
			presenter.markers = presenter.getMarked(markedWrong, markedCorrect);
		}

		presenter.$view.append($res);
		presenter.setVisibility(presenter.configuration.isVisible);
	}

	presenter.ERROR_CODES = {
		M01: 'Text cannot be empty',
		M02: 'Text cannot be w/o \\correct{} or \\wrong{}',
		M03: 'You cannot use \\wrong{} in "All selectable" mode',
		M04: 'Markers cannot be empty',
		M05: 'In single selection you have to mark only one phrase as correct and at least one mark as wrong'
	};

	presenter.MODE = {
		'Mark phrases to select': 'MARK_PHRASES',
		'All selectable': 'ALL_SELECTABLE',
		DEFAULT: 'Mark phrases to select'
	};

	presenter.SELECTION_TYPE = {
		'Single select': 'SINGLESELECT',
		'Multiselect': 'MULTISELECT',
		DEFAULT: 'Single select'
	};
	
	presenter.run = function(view, model) {
		presenter.presenterLogic(view, model, false);
		presenter.turnOnEventListeners();
	};

	presenter.createPreview = function(view, model) {
		presenter.presenterLogic(view, model, true);
	};

	function returnErrorObject(errorCode) {
		return { isValid: false, errorCode: errorCode };
	}

	presenter.validateModel = function(model) {

		if (ModelValidationUtils.isStringEmpty(model.Text)) {
			return returnErrorObject('M01');
		}

		var mode = ModelValidationUtils.validateOption(presenter.MODE, model.Mode);
		var selection_type = ModelValidationUtils.validateOption(presenter.SELECTION_TYPE, model['Selection type']);

		var parsedWords = presenter.parseWords(model.Text, mode, selection_type);
		if (!parsedWords.isValid){
			return returnErrorObject(parsedWords.errorCode);
		}

		return {
			isValid: true,
			mode: mode,
			selection_type: selection_type,
			words: parsedWords.words,
			isVisible: ModelValidationUtils.validateBoolean(model["Is Visible"]),
			isExerciseStarted: false
		};
	};

	presenter.getMarked = function(wrong, correct) {
		return {
			markedWrong: wrong,
			markedCorrect: correct
		};
	};

	presenter.connectWords = function(words) {
		var i, j, longWord = '', result = [];

		for (i=0; i<words.length; i++) {
			if ((presenter.isStartedCorrect(words[i]) || presenter.isStartedWrong(words[i])) && !presenter.isMarkedCorrect(words[i]) && !presenter.isMarkedWrong(words[i])) {
				if (presenter.isStartedCorrect(words[i])) {
					longWord += words[i] + ' ';
					for (j=i+1; j<words.length; j++) {
						if(presenter.hasClosingBracket(words[j])) {
							longWord += words[j];
							i = j;
							j = words.length + 1;
						} else {
							longWord += words[j] + ' ';
						}
					}
					result.push(longWord);
					longWord = '';
				} else if (presenter.isStartedWrong(words[i])) {
					longWord += words[i] + ' ';
					for (j=i+1; j<words.length; j++) {
						if(presenter.hasClosingBracket(words[j])) {
							longWord += words[j];
							i = j;
							j = words.length + 1;
						} else {
							longWord += words[j] + ' ';
						}
					}
					result.push(longWord);
					longWord = '';
				}
			} else {
				result.push(words[i]);
			}
		}

		return result;
	}

	presenter.parseWords = function(text, mode, selection_type) {
		words = text.split(' ');

		words = presenter.connectWords(words);

		if (!presenter.hasCorrectOrWrongMarker(words)) {
			return returnErrorObject('M02');
		}

		if (presenter.wrongMarkerInAllSelectable(words, mode)) {
			return returnErrorObject('M03');
		}

		if (presenter.emptyWordInMarker(words)) {
			return returnErrorObject('M04');
		}

		if (!presenter.HasOneCorrectAtLeastOneWrongInSingleSelectionTypeSelection(words, selection_type)) {
			return returnErrorObject('M05');
		}

		return {
			isValid: true,
			words: words
		};
	};

	presenter.hasCorrectOrWrongMarker = function(words) {

		for (var i=0; i<words.length; i++) {
			if (presenter.isMarkedWrong(words[i])) {
				return true;
			}
			if (presenter.isMarkedCorrect(words[i])) {
				return true;
			}
		}

		return false;
	};

	presenter.wrongMarkerInAllSelectable = function(words, mode) {

		if (mode === 'ALL_SELECTABLE') {
			for (var i=0; i<words.length; i++) {
				if (presenter.isMarkedWrong(words[i])) {
					return true;
				}
			}
		}

		return false;
	};
			

	presenter.emptyWordInMarker = function(words) {

		for (var i=0; i<words.length; i++) {
			if (presenter.isMarkedWrong(words[i]) && presenter.cutMarkedWrong(words[i]) === "") {
				return true;
			}
			if (presenter.isMarkedCorrect(words[i]) && presenter.cutMarkedCorrect(words[i]) === "") {
				return true;
			}
		}

		return false;
	};

	presenter.HasOneCorrectAtLeastOneWrongInSingleSelectionTypeSelection = function(words, selection_type) {
		var markedCorrect = 0,
		markedWrong = 0;

		for (var i=0; i<words.length; i++) {
			if (presenter.isMarkedCorrect(words[i])) {
				markedCorrect++;
			} else if(presenter.isMarkedWrong(words[i])) {
				markedWrong++;
			}
		}

		if((markedCorrect !== 1 || markedWrong < 1) && selection_type === 'SINGLESELECT') {
			return false
		} else {
			return true;
		}
	}

	presenter.executeCommand = function(name, params) {
		if (!presenter.configuration.isValid) return;

		var commands = {
			'show': presenter.show,
			'hide': presenter.hide
		};

		Commands.dispatch(commands, name, params, presenter);
	};

	presenter.setVisibility = function(isVisible) {
		presenter.$view.css("visibility", isVisible ? "visible" : "hidden");
	};

	presenter.show = function() {
		presenter.setVisibility(true);
		presenter.configuration.isVisible = true;
	};

	presenter.hide = function() {
		presenter.setVisibility(false);
		presenter.configuration.isVisible = false;
	};

	presenter.reset = function() {
		presenter.$view.find('.text_selection').find('.selected').removeClass("selected");
		presenter.show();
	};

	presenter.getState = function() {
		var numberSelected = [];

		var allSelected = presenter.$view.find('.text_selection').find('.selected');

		for(var i=0; i<allSelected.length; i++){
			numberSelected.push($(allSelected[i]).attr('number'));
		}

		return JSON.stringify({
			numbers: numberSelected,
			isVisible: presenter.configuration.isVisible
		});
	};

	presenter.setState = function(state) {
		if (ModelValidationUtils.isStringEmpty(state)) return;

		var nums      = JSON.parse(state).numbers,
		isVisible = JSON.parse(state).isVisible;

		for(var i=0; i<nums.length; i++){
			presenter.$view.find('.text_selection').find("span[number='" + nums[i] + "']").addClass("selected");
		}

		if(isVisible) {
			presenter.show();
		} else {
			presenter.hide();
		}

		presenter.configuration.isVisible = isVisible;
	};

	function intersection(a, b) {
		return a.filter(function(i) {
			return b.indexOf(parseInt(i, 10)) != -1;
		});
	}

	function arr_diff(a1, a2){
		var a=[], diff=[], i;

		for(i=0; i<a1.length; i++) {
			a[a1[i]]=true;
		}

		for(i=0; i<a2.length; i++) {
			if(a[a2[i]]) {
				delete a[a2[i]];
			} else {
				a[a2[i]]=true;
			}
		}

		for(var k in a) {
			diff.push(k);
		}

		return diff;
	}

	presenter.setShowErrorsMode = function() {
		if (!presenter.configuration.isExerciseStarted) return;

		var i;

		presenter.turnOffEventListeners();

		var numbersSelected = presenter.$view.find('.text_selection').find('.selected').map(function() {
			return this.getAttribute('number');
		}).get();
		var numbersCorrect = presenter.markers.markedCorrect;
		var numbersWrong = presenter.markers.markedWrong;

		var correctSelected = intersection(numbersSelected, numbersCorrect);
		var notSelectedWrong = arr_diff(numbersWrong, numbersSelected);
		var green = correctSelected.concat(notSelectedWrong).sort();

		for(i=0; i<green.length; i++) {
			presenter.$view.find('.text_selection').find("span[number='" + green[i] + "']").addClass('correct');
		}

		var selectedWrong = intersection(numbersSelected, numbersWrong);
		var notSelectedCorrect = arr_diff(numbersCorrect, numbersSelected);
		var red = selectedWrong.concat(notSelectedCorrect).sort();

		for(i=0; i<red.length; i++) {
			presenter.$view.find('.text_selection').find("span[number='" + red[i] + "']").addClass('wrong');
		}
	};

	presenter.setWorkMode = function() {
		presenter.turnOnEventListeners();
		presenter.$view.find('.text_selection').find('.correct').removeClass('correct');
		presenter.$view.find('.text_selection').find('.wrong').removeClass('wrong');
	};

	function points(selector) {
		var i, counter = 0;

		var numbersSelected = presenter.$view.find('.text_selection').find('.selected').map(function() {
			return parseInt(this.getAttribute('number'));
		}).get();

		return intersection(selector, numbersSelected).length;
	}

	presenter.getErrorCount = function() {
		return points(presenter.markers.markedWrong);
	};

	presenter.getMaxScore = function() {
		return presenter.markers.markedCorrect.length;
	};

	presenter.getScore = function() {
		return points(presenter.markers.markedCorrect);
	};

	return presenter;
}