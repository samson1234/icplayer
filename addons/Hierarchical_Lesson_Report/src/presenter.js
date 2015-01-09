function AddonHierarchical_Lesson_Report_create() {
    var presenter = function () {};
    var presentationController;
    var pageIndex = 0;
    var totalChecks = 0;
    var totalErrors = 0;
    var totalMistakes = 0;
    var totalPoints = 0;
    var totalMaxScore = 0;

    var isPreview = false;

    presenter.ERROR_MESSAGES = {
        EXPAND_DEPTH_NOT_NUMERIC: "Depth of expand is not proper",

        C01: "Wrong classes name format",
        C02: "Class names has to be separated by new line",

        D01: "Values in Disable score on pages property should be numeric and non empty",
        D02: "Values in Disable score on pages property should be greater than 0",
        D03: "Values in Disable score on pages property should be unique"
    };

    function returnErrorObject(ec) { return { isValid: false, errorCode: ec }; }

    function returnCorrectObject(v) { return { isValid: true, value: v }; }

    presenter.showErrorMessage = function (message, substitutions) {
        var errorContainer;
        if (typeof(substitutions) == 'undefined') {
            errorContainer = '<p>' + message + '</p>';
        } else {
            var messageSubst = message;
            for (var key in substitutions) {
                messageSubst = messageSubst.replace('%' + key + '%', substitutions[key]);
            }
            errorContainer = '<p>' + messageSubst + '</p>';
        }
        presenter.$view.html(errorContainer);
    };

    presenter.setPlayerController = function (controller) {
        presentationController = controller;
    };

    presenter.run = function (view, model) {
        isPreview = false;
        presenter.initialize(view, model);
    };

    presenter.createPreview = function (view, model) {
        isPreview = true;
        presenter.initialize(view, model);
    };

    function addHeader() {
        var headerHTML = "<td> " + presenter.configuration.titleLabel + "</td>";
        if (presenter.configuration.showResults) headerHTML += "<td class='hier_report-progress'> " + presenter.configuration.resultsLabel + "</td>";
        if (presenter.configuration.showChecks) headerHTML += "<td class='hier_report-checks'> " + presenter.configuration.checksLabel + "</td>";
        if (presenter.configuration.showMistakes) headerHTML += "<td class='hier_report-mistakes'> " + presenter.configuration.mistakesLabel + "</td>";
        if (presenter.configuration.showErrors) headerHTML += "<td class='hier_report-errors'> " + presenter.configuration.errorsLabel + "</td>";
        if (presenter.configuration.showPageScore) headerHTML += "<td class='hier_report-page-score'> </td>";
        if (presenter.configuration.showMaxScoreField) headerHTML += "<td></td>";
        $("<tr></tr>").prependTo($("#" + presenter.treeID).find('table')).addClass("hier_report-header").html(headerHTML);
    }

    function addFooter() {
        var row = document.createElement('tr');
        $(row).appendTo($("#" + presenter.treeID).find('table'));
        $(row).addClass("hier_report-footer");

        $("<td></td>").appendTo($(row)).html(presenter.configuration.totalLabel);

        if (presenter.configuration.showResults) {
            var score = resetScore();

            if (!isPreview)  {
                var playerUtils = new PlayerUtils({});
                playerUtils.scoreService = presentationController.getScore();
                var totalScore = playerUtils.getPresentationScore(presentationController.getPresentation());
                score = {
                    score: totalScore.scaledScore,
                    count: 1
                }
            }
            createProgressCell(row, score);
        }

        if (presenter.configuration.showChecks) {
            $("<td></td>").appendTo($(row)).addClass("hier_report-checks").html(totalChecks);
        }

        if (presenter.configuration.showMistakes) {
            $("<td></td>").appendTo($(row)).addClass("hier_report-mistakes").html(totalMistakes);
        }

        if (presenter.configuration.showErrors) {
            $("<td></td>").appendTo($(row)).addClass("hier_report-errors").html(totalErrors);
        }

        if (presenter.configuration.showPageScore) {
            var content = totalPoints + "<span class='hier_report-separator'>/</span>" + totalMaxScore;
            $("<td></td>").appendTo($(row)).addClass("hier_report-page-score").html(content);
        }

        if (presenter.configuration.showMaxScoreField) {
            $("<td></td>").appendTo($(row));
        }
    }

    function createRow(index, parentIndex, isChapter) {
        var row = document.createElement('tr');

        $(row).appendTo($("#" + presenter.treeID).find('table'));
        $(row).addClass("treegrid-" + index);
        $(row).addClass(presenter.configuration.classes[index % presenter.configuration.classes.length]);

        if (parentIndex != null) {
        	$(row).addClass("treegrid-parent-" + parentIndex);
        }

        if (isChapter) {
        	$(row).addClass("hier_report-chapter");
        } else {
            $(row).addClass(index % 2 > 0 ? "hier_report-odd" : "hier_report-even");
        }

        return row;
    }

    function createProgressCell(row, score, index, isChapter) {
        var progressCell = document.createElement('td');
        $(progressCell).appendTo($(row)).addClass("hier_report-progress");

        var progressbar = document.createElement('div');
        $(progressbar).appendTo($(progressCell));
        $(progressbar).attr("id", "progressbar-" + index);
        $(progressbar).addClass("hier_report-progressbar");

        var percent = Math.floor(score.score / score.count * 100);

        var progressInfo = document.createElement('div');
        $(progressInfo).appendTo($(progressCell)).attr("style", "float: right").html(percent + "%");

        if (!isChapter) {
            $(progressbar).progressbar({
                value: Math.floor(score.score * 100),
                max: 100
            });
        }
    }

    function createScoreCells(row, pageId, index, isChapter) {
        var isScoreEnable = presenter.configuration.disabledScorePages.indexOf(index) === -1;
        var score = resetScore();
        if (!isPreview) score = presentationController.getScore().getPageScoreById(pageId);
        var points = 0;

        if (!isChapter) {
            points = score.score;
        	score.count = 1;
        	score.score = score.maxScore !== 0 ? score.score / score.maxScore : 0;
        }

        if (isScoreEnable) {
            if (presenter.configuration.showResults) {
                createProgressCell(row, score, index, isChapter);
            }

            if (presenter.configuration.showChecks) {
                var checksCell = document.createElement('td');
                $(checksCell).appendTo($(row))
                    .addClass("hier_report-checks")
                    .html(score.checkCount);
                totalChecks += score.checkCount;
            }

            if (presenter.configuration.showMistakes) {
                var mistakesCell = document.createElement('td');
                $(mistakesCell).appendTo($(row))
                    .addClass("hier_report-mistakes")
                    .html(score.mistakeCount);
                totalMistakes += score.mistakeCount;
            }

            if (presenter.configuration.showErrors) {
                var errorsCell = document.createElement('td');
                $(errorsCell).appendTo($(row))
                    .addClass("hier_report-errors")
                    .html(score.errorCount);
                totalErrors += score.errorCount;
            }

            if (presenter.configuration.showPageScore) {
                $("<td></td>").appendTo($(row))
                    .addClass("hier_report-page-score")
                    .html(points + "<span class='hier_report-separator'>/</span>" + score.maxScore);
                totalPoints += points;
                totalMaxScore += score.maxScore;
            }

            if (presenter.configuration.showMaxScoreField) {
                var className = (points === score.maxScore && score.maxScore !== 0 ? "page-max-score" : "page-non-max-score");
                $("<td></td>").appendTo($(row)).addClass("hier_report-" + className);
            }
        } else {
            var c = presenter.configuration;
            var columns = [c.showResults, c.showChecks, c.showMistakes, c.showErrors, c.showPageScore, c.showMaxScoreField].filter(function(a) { return a }).length;
            $("<td colspan='" + columns + "'></td>").appendTo($(row)).addClass("hier_report-score-disabled-row");
        }

    }

    function generatePageLinks(text, isChapter, pageId) {
        var $element = $(document.createElement('td')),
            $link = $("<a></a>").text(text).attr('href', '#').attr('data-page-id', pageId);

        $element.append($('<div class="text-wrapper">').html(isChapter ? text : $link));

        return $element;
    }

    function addRow(name, index, parrentIndex, isChapter, pageId) {
        var row = createRow(index, parrentIndex, isChapter);

        var nameCell = generatePageLinks(name, isChapter, pageId);
        $(nameCell).appendTo($(row));

        createScoreCells(row, pageId, index, isChapter);
    }

    function updateRow(pageIndex, pageScore, isEmptyChapter) {
        var row = $(".treegrid-" + pageIndex);

        if (presenter.configuration.showResults) {
            if (isEmptyChapter) {
                var progresscell = $(row).find(".hier_report-progress");
                $(progresscell).children().remove();
                $(progresscell).html("-");
            } else {
                var percent = (Math.floor((pageScore.score / pageScore.count) * 100));
                var progressbar = $(row).find("#progressbar-" + pageIndex);
                $(progressbar).progressbar({value: Math.floor((pageScore.score / pageScore.count) * 100), max: 100});
                $(progressbar).closest("div").next().html(percent + "%");
            }
        }

        if (presenter.configuration.showChecks) {
            $(row).find(".hier_report-checks").html(isEmptyChapter ? "-" : pageScore.checkCount);
        }

        if (presenter.configuration.showMistakes) {
            $(row).find(".hier_report-mistakes").html(isEmptyChapter ? "-" : pageScore.mistakeCount);
        }

        if (presenter.configuration.showErrors) {
            $(row).find(".hier_report-errors").html(isEmptyChapter ? "-" : pageScore.errorCount);
        }
    }

    function updateScore(score, update) {
        score.score += update.maxScore === 0 ? update.score : update.score/update.maxScore;
        score.errorCount += update.errorCount;
        score.checkCount += update.checkCount;
        score.mistakeCount += update.mistakeCount;
        score.count += update.count;
        return score;
    }

    function resetScore() {
        return {
            score: 0,
            maxScore: 0,
            errorCount: 0,
            checkCount: 0,
            mistakeCount: 0,
            count: 0
        };
    }

    presenter.createPreviewTree = function() {
        var pagesMockup = [
            {name : "Page1", parent : null},
            {name : "Unit1", parent : null},
            {name : "Page2", parent : 1},
            {name : "Chapter1", parent : 1},
            {name : "Page3", parent : 3},
            {name : "Page4", parent : 3},
            {name : "Chapter2", parent : 1},
            {name : "Page5", parent : 6},
            {name : "Page6", parent : 1},
            {name : "Page7", parent : null},
            {name : "Page8", parent : null},
            {name : "Page9", parent : null},
            {name : "Page10", parent : null},
            {name : "Page11", parent : null}
        ];

        var chapterScore = resetScore();
        for (var i = 0; i < pagesMockup.length; i++) {
            addRow(pagesMockup[i].name, i, pagesMockup[i].parent, false, "some_id");
        }
        return chapterScore;
    };

    presenter.createTree = function (root, parrentIndex, pageCount) {
        var chapterIndex = 0,
            chapterScore = resetScore(),
            pageScore = resetScore(),
            isEmpty = true,
            values = {};

        for (var i = 0; i < pageCount; i++) {
            var isChapter = (root.get(i).type == "chapter");
            if (!isChapter && !root.get(i).isReportable()) continue;
            if (!isChapter && root.get(i).isReportable()) {
            	isEmpty = false;
            }
            var pageId = "chapter";
            if (!isChapter) {
            	pageId = root.get(i).getId();
            }
            addRow(root.get(i).getName(), pageIndex, parrentIndex, isChapter, pageId);
            pageScore = presentationController.getScore().getPageScoreById(pageId);
            pageScore.count = 1;
            pageIndex++;
            if (isChapter) {
            	chapterIndex = pageIndex - 1;
            	values = presenter.createTree(root.get(i), chapterIndex, root.get(i).size());
            	updateRow(chapterIndex, values.pagesScore, values.isEmpty);
            	pageScore =  values.pagesScore;
            }
           	chapterScore = updateScore(chapterScore, pageScore);
        }

        return { pagesScore: chapterScore, isEmpty: isEmpty };
    };

    function handleMouseClickActions() {
        var commander = presentationController.getCommands(),
            $report = presenter.$view.find('.hier_report tr');

        $report.find('td a').each(function () {
            $(this).click(function (event) {
                event.preventDefault();
                event.stopPropagation();
                commander.gotoPageId($(this).attr('data-page-id'));
            });
        });

        $report.find('.treegrid-expander').each(function () {
            $(this).click(function (event) {
                event.preventDefault();
                event.stopPropagation();
            });
        });
    }

    function expandTree(level) {
        $('.hier_report table').find('tr').not('.hier_report-header').not('.hier_report-footer').each(function () {
            if ($(this).treegrid('getDepth') < level) {
                $(this).treegrid('expand');
            }
        });
    }

    function saveTreeState() {
        var state = [];
        $('.hier_report table').find('tr').not('.hier_report-header').not('.hier_report-footer').each(function () {
            state.push($(this).treegrid('isExpanded'))
        });
        return state;
    }

    function restoreTreeState(state) {
        $('.hier_report table').find('tr').not('.hier_report-header').not('.hier_report-footer').each(function () {
            $(this).treegrid(state[$(this).treegrid('getNodeId')] ? 'expand' : 'collapse');
        });
    }

    presenter.getState = function () {
        return JSON.stringify({
            'treeState': saveTreeState(),
            'isVisible': presenter.configuration.isVisible
        });
    };

    presenter.setState = function (stateString) {
        var state = JSON.parse(stateString);

        restoreTreeState(state.treeState);

        presenter.setVisibility(state.isVisible);
        presenter.configuration.isVisible = state.isVisible;
    };

    function parseClasses(classes_text) {
        function isValidClassName(class_name) {
            return /^[a-z_-][a-z\d_-]*$/i.test(class_name);
        }

        if (ModelValidationUtils.isStringEmpty(classes_text)) {
            return returnCorrectObject([]);
        }

        var classes = classes_text.split('\n');
        for (var i=0; i<classes.length; i++) {
            if (classes[i].indexOf(' ') !== -1) {
                return returnErrorObject("C02");
            }

            if (!isValidClassName(classes[i])) {
                return returnErrorObject("C01");
            }
        }

        return returnCorrectObject(classes);
    }

    function parseScoreDisable(pages_text) {
        if (ModelValidationUtils.isStringEmpty(pages_text)) {
            return returnCorrectObject([]);
        }

        var i;

        var pages = pages_text.split(';');
        for (i=0; i<pages.length; i++) {
            var numberObject = ModelValidationUtils.validateInteger(pages[i]);
            if (!numberObject.isValid) {
                return returnErrorObject("D01");
            }

            pages[i] = numberObject.value - 1; // indexing from 0

            if (pages[i] < 0) {
                return returnErrorObject("D02");
            }
        }

        for (i=1; i<pages.length; i++) {
            if (pages.sort()[i] === pages.sort()[i-1]) {
                return returnErrorObject("D03");
            }
        }

        return returnCorrectObject(pages.sort());
    }

    presenter.validateModel = function (model) {
        var expandDepth = returnCorrectObject(0);

        if (model['expandDepth'].length > 0) {
            expandDepth = ModelValidationUtils.validateInteger(model['expandDepth']);
            if (!expandDepth.isValid) {
                return returnErrorObject('EXPAND_DEPTH_NOT_NUMERIC');
            }
        }

        var validatedClasses = parseClasses(model["classes"]);
        if (!validatedClasses.isValid) {
            return returnErrorObject(validatedClasses.errorCode);
        }

        var validatedDisabledScorePages = parseScoreDisable(model["scoredisabled"]);
        if (!validatedDisabledScorePages.isValid) {
            return returnErrorObject(validatedDisabledScorePages.errorCode);
        }

        return {
            ID: model.ID,
            isValid: true,
            width: parseInt(model["Width"], 10),
            height: parseInt(model["Height"], 10),
            isVisible: ModelValidationUtils.validateBoolean(model["Is Visible"]),

            showResults: ModelValidationUtils.validateBoolean(model["results"]),
            showErrors: ModelValidationUtils.validateBoolean(model["errors"]),
            showChecks: ModelValidationUtils.validateBoolean(model["checks"]),
            showMistakes: ModelValidationUtils.validateBoolean(model["mistakes"]),
            resultsLabel: model['resultsLabel'],
            errorsLabel: model['errorsLabel'],
            checksLabel: model['checksLabel'],
            mistakesLabel: model['mistakesLabel'],
            showTotal: ModelValidationUtils.validateBoolean(model["total"]),
            totalLabel: model['totalLabel'],
            titleLabel: model['titleLabel'],
            expandDepth: expandDepth.value,
            classes: validatedClasses.value,
            showPageScore: ModelValidationUtils.validateBoolean(model["showpagescore"]),
            showMaxScoreField: ModelValidationUtils.validateBoolean(model["showmaxscorefield"]),
            disabledScorePages: validatedDisabledScorePages.value
        };
    };

    presenter.setVisibility = function (isVisible) {
        presenter.$view.css("visibility", isVisible ? "visible" : "hidden");
    };

    presenter.initialize = function (view, model) {
        presenter.$view = $(view);

        presenter.configuration = presenter.validateModel(model);
        if (!presenter.configuration.isValid) {
            presenter.showErrorMessage(presenter.ERROR_MESSAGES[presenter.configuration.errorCode]);
            return;
        }

        $('.hier_report').attr("style", "height: " + presenter.configuration.height + "px");
        presenter.treeID = presenter.configuration.ID + (isPreview ? "Preview" : "");
        presenter.$view.find("div").first().attr('id', presenter.treeID);

        presenter.setVisibility(presenter.configuration.isVisible);

        addHeader();
        if (isPreview) {
            presenter.createPreviewTree();
        } else {
            var presentation = presentationController.getPresentation();
            presenter.createTree(presentation.getTableOfContents(), null, presentation.getTableOfContents().size());
        }

        if (presenter.configuration.showTotal) {
            addFooter();
        }

        $("#" + presenter.treeID).find('table').not('.hier_report-header').not('.hier_report-footer').treegrid({
            'initialState': 'collapsed',
            'expanderTemplate': '<div class="treegrid-expander"></div>'
        });

        expandTree(presenter.configuration.expandDepth);
        if (!isPreview) {
            handleMouseClickActions();
        }
    };

    return presenter;
}