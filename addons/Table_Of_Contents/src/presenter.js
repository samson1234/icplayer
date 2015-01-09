function AddonTable_Of_Contents_create(){
    var presenter = function() {};
    var presentationController;

    var elementsHeights = {};

    presenter.ERROR_CODES = {
        E01: "Values in property 'Don't show' pages must be numeric",
        E02: "Values in property 'Don't show' pages must be greater than 0",
        E03: "Values in property 'Don't show' pages must be unique"
    };

    function getErrorObject(ec) { return { isValid: false, errorCode: ec }; }

    function getCorrectObject(v) { return { isValid: true, value: v }; }

    function setElementsDimensions(addonWidth, addonHeight) {
        var wrapper = presenter.$view.find('.table-of-contents:first')[0];
        var wrapperDimensions = DOMOperationsUtils.getOuterDimensions(wrapper);
        var wrapperDistances = DOMOperationsUtils.calculateOuterDistances(wrapperDimensions);
        $(wrapper).css({
            width: addonWidth - wrapperDistances.horizontal,
            height: addonHeight - wrapperDistances.vertical
        });

        elementsHeights.wrapper = $(wrapper).height();

        var title = presenter.$view.find('.table-of-contents-title')[0];
        var titleDimensions = DOMOperationsUtils.getOuterDimensions(title);
        var titleDistances = DOMOperationsUtils.calculateOuterDistances(titleDimensions);
        $(title).css({
            width: $(wrapper).width() - titleDistances.horizontal
        });

        elementsHeights.title = $(title).height() + titleDistances.vertical;

        var pagination = presenter.$view.find('.table-of-contents-pagination')[0];
        var paginationDimensions = DOMOperationsUtils.getOuterDimensions(pagination);
        var paginationDistances = DOMOperationsUtils.calculateOuterDistances(paginationDimensions);
        $(pagination).css({
            width: $(wrapper).width() - paginationDistances.horizontal
        });

        elementsHeights.pagination = $(pagination).height() + paginationDistances.vertical;

        var list = presenter.$view.find('.table-of-contents-list')[0];
        var listDimensions = DOMOperationsUtils.getOuterDimensions(list);
        var listDistances = DOMOperationsUtils.calculateOuterDistances(listDimensions);
        $(list).css({
            height: $(wrapper).height - elementsHeights.title - elementsHeights.pagination - listDistances.vertical,
            width: $(wrapper).width - listDistances.horizontal
        });

        elementsHeights.list = $(list).height() + listDistances.vertical;
    }


    function generateElement (text) {
        var $element = $(document.createElement('li')),
            $link = $(document.createElement('a'));

        $link.text(text);
        $link.attr('href', '#');
        $element.html($link);

        return $element;
    }

    function generateListElements () {
        var $list = presenter.$view.find('.table-of-contents .table-of-contents-list ol');

        for (var i = 0; i < presenter.pages.length; i++) {
            $list.append(generateElement(presenter.pages[i].name));
        }

        return $list.outerHeight();
    }

    presenter.pageStartIndex = function(page) {
        var index = 0;
        for (var i = 0; i < page; i++) {
            index += presenter.pagination.pages[i].length;
        }
        return index+1;
    }

    function displayPage(page) {
        var $list = presenter.$view.find('.table-of-contents .table-of-contents-list ol'),
            pages = presenter.pagination.pages[page], i,
            startIndex = presenter.pageStartIndex(page),
            $pageList = presenter.$view.find('.table-of-contents-pagination');

        $list.find('li').hide();
        $list.attr('start', '' + startIndex);
        for (i = 0; i < pages.length; i++) {
            $list.find('li:eq(' + pages[i] + ')').show();
        }

        $pageList.children().removeClass('selected');
        $pageList.find('a').each(function(){
            if ($(this).text()==(page+1)) {
                $(this).addClass('selected');
            }
        });
   }

    function isSpaceSufficient($list, spareHeight) {
        return $list.find('li:first').outerHeight() < spareHeight;
    }

    function paginateList(spareHeight, isPreview) {
        var $list = presenter.$view.find('.table-of-contents .table-of-contents-list ol');
        var $pagination = presenter.$view.find('.table-of-contents .table-of-contents-pagination');

        if (!isSpaceSufficient($list, spareHeight)) return false;

        var currentPageHeight = 0, page, i;
        presenter.pagination = {
            pages: [[]],
            size: 0
        };

        $list.find('li').each(function (index, value) {
            var outerHeight = $(value).outerHeight();

            if (currentPageHeight + outerHeight > spareHeight) {
                presenter.pagination.size++;
                currentPageHeight = 0;
                presenter.pagination.pages[presenter.pagination.size] = [];
            }

            currentPageHeight += outerHeight;
            presenter.pagination.pages[presenter.pagination.size].push(index);
        });

        for (i = 1; i <= presenter.pagination.size; i++) {
            var $element = $(document.createElement('a'));
            $element.text(i + 1);
            $element.attr('href', '#');
            $pagination.append($element);
        }

        displayPage(0);
        if (!isPreview) handlePaginationMouseActions();

        return true;
    }

    function handleMouseClickActions() {
        var commander = presentationController.getCommands(),
            presentation = presentationController.getPresentation(),
            $list = presenter.$view.find('.table-of-contents-list ol'),
            currentPageIndex = presentation.getPage(presentationController.getCurrentPageIndex()).getId(),
            pageName;

        $list.find('li a').each(function () {
            $(this).click(function (event) {
                event.stopPropagation();
                event.preventDefault();
                pageName = $(this).text();
                for(var p in presenter.pages) {
                    var page = presenter.pages[p];

                    if (currentPageIndex !== page.index && pageName === page.name) {
                        commander.gotoPageIndex(page.numberOfIndex);
                    }
                }
            });
        });
    }

    function handlePaginationMouseActions() {
        var lists = presenter.$view.find('.table-of-contents .table-of-contents-list'),
        $pagination = presenter.$view.find('.table-of-contents-pagination');

        $pagination.click(function (event) {
            event.stopPropagation();
        });

        presenter.$view.find('.table-of-contents-pagination a').each(function() {
            $(this).click(function(event) {
                event.stopPropagation();
                event.preventDefault();
                displayPage(parseInt($(this).text(), 10) - 1);
            });
        });
    }

    function presenterLogic(view, model, isPreview) {
        presenter.configuration = presenter.validateModel(model);
        if (!presenter.configuration.isValid) {
            DOMOperationsUtils.showErrorMessage(view, presenter.ERROR_CODES, presenter.configuration.errorCode);
            return false;
        }

        function reportInsufficientSpace() {
            presenter.$view.html('<strong>Available space is insufficient! Please enlarge addon dimensions.</strong>')
        }

        presenter.pages = isPreview ? mockPresentationPages() : presenter.getPresentationPages();
        presenter.$view = $(view);

        setElementsDimensions(model.Width, model.Height);

        var listHeight = generateListElements(),
            spareHeight = elementsHeights.wrapper - elementsHeights.title;

        var $list = presenter.$view.find('.table-of-contents .table-of-contents-list ol');
        if (!isSpaceSufficient($list, spareHeight)) {
            reportInsufficientSpace();
        }

        if (listHeight > spareHeight) {
            if (!paginateList(spareHeight - elementsHeights.pagination, isPreview)) {
                reportInsufficientSpace();
            }
        } else {
            presenter.$view.find('.table-of-contents-pagination').hide();
        }
        if (!isPreview) handleMouseClickActions();
        if (!ModelValidationUtils.isStringEmpty(model['Header'])) {
        	presenter.$view.find('.table-of-contents .table-of-contents-title').text(model['Header'])
        }
    }

    presenter.validateHiddenPages = function(hiddenPages) {
        if (typeof(hiddenPages) == 'undefined') {
            hiddenPages = '';
        }

        var pages = hiddenPages.split(';').sort();

        for (var i = 0; i < pages.length; i++) {
            var numberObject = ModelValidationUtils.validateInteger(pages[i]);

            if (!numberObject.isValid && hiddenPages.length > 0) {
                return getErrorObject("E01");
            }

            if (pages[i] < 0) {
                return getErrorObject("E02");
            }

            if (pages[i] === pages[i - 1]) {
                return getErrorObject("E03");
            }
        }
        return getCorrectObject(pages);
    }

    presenter.validateModel = function(model) {
        var pagesValidationResult = presenter.validateHiddenPages(model['DontShowPages']);
        if (!pagesValidationResult.isValid) {
            return pagesValidationResult;
        }

        return {
            ID: model.ID,
            isValid: true,
            hiddenPages: pagesValidationResult.value
        };
    };

    presenter.getPresentationPages = function() {
        var pages = [],
            presentation = presentationController.getPresentation(),
            pageCount = presentation.getPageCount();

        for (var i = 0; i < pageCount; i++) {
            if ($.inArray(String(i+1), presenter.configuration.hiddenPages) == -1) {
                var page = {};
                page.name = presentation.getPage(i).getName();
                page.index = presentation.getPage(i).getId();
                page.numberOfIndex = i;

                pages.push(page);
            }
        }

        return pages;
    };

    function mockPresentationPages() {
        return [
            {index:"fwrg4g1",
             name:"Page 01",
             numberOfIndex:"0"},
            {index:"fwrg4g2",
             name:"Page 02",
             numberOfIndex:"1"},
            {index:"fwrg4g3",
             name:"Page 03",
             numberOfIndex:"2"},
            {index:"fwrg4g4",
             name:"Page 04",
             numberOfIndex:"3"},
            {index:"fwrg4g5",
             name:"Page 05",
             numberOfIndex:"4"},
            {index:"fwrg4g6",
             name:"Page 06",
             numberOfIndex:"5"},
            {index:"fwrg4g7",
             name:"Page 07",
             numberOfIndex:"6"},
            {index:"fwrg4g8",
             name:"Page 08",
             numberOfIndex:"7"},
            {index:"fwrg4g9",
             name:"Page 09",
             numberOfIndex:"8"},
            {index:"fwrg4g0",
             name:"Page 10",
             numberOfIndex:"9"}
        ];
    }

    presenter.createPreview = function(view, model){
        presenterLogic(view, model, true);
    };

    presenter.run = function(view, model){
        presenterLogic(view, model, false);
    };

    presenter.setPlayerController = function(controller) {
        presentationController = controller;
    };

    return presenter;
}