var ModelValidationTests = AsyncTestCase('ModelValidationTests');

ModelValidationTests.prototype.setUp = function() {
    this.presenter = AddonTextAudio_create();
};

ModelValidationTests.prototype.tearDown = function() {
};

ModelValidationTests.prototype.testProperSlidesModel = function() {
    var model = {
        'mp3': '/some/file.mp3',
        //'ogg': '/some/file.ogg',
        'Slides': [
            {
                'Text': 'Lorem|| Ipsum|| Dolor',
                'Times': '00:00-00:02' + "\n" +
                         '00:02-00:04' + "\n" +
                         '00:04-00:06'
            },
            {
                'Text': 'sit|| amet|| consectetur',
                'Times': '00:06-00:08' + "\n" +
                         '00:08-00:10' + "\n" +
                         '00:10-00:12'
            }
        ]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertTrue(validatedModel.isValid);
};

ModelValidationTests.prototype.testNoFileError = function() {
    var model = {
        'mp3': '',
        'ogg': '',
        'Slides': [
            {
                'Text': 'Lorem|| Ipsum|| Dolor',
                'Times': '00:00-00:02' + "\n" +
                         '00:02-00:04' + "\n" +
                         '00:04-00:06'
            },
            {
                'Text': 'sit|| amet|| consectetur',
                'Times': '00:06-00:08' + "\n" +
                         '00:08-00:10' + "\n" +
                         '00:10-00:12'
            }
        ]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'M01');
};

ModelValidationTests.prototype.testNumberOfSlidesDifferentThanTimeEntries = function() {
    var model = {
        'mp3': '/some/file.mp3',
        'Slides': [
            {
                'Text': 'Lorem|| Ipsum|| Dolor',
                'Times': '00:00-00:02' + "\n" +
                         '00:02-00:04' + "\n" +
                         '00:04-00:06'
            },
            {
                'Text': 'sit|| amet|| consectetur',
                'Times': '00:06-00:08' + "\n" +
                         '00:08-00:10'
            }
        ]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'M02');
};

ModelValidationTests.prototype.testTimeEndsBeforeStart = function() {
    var model = {
        'mp3': '/some/file.mp3',
        'Slides': [
            {
                'Text': 'Lorem|| Ipsum|| Dolor',
                'Times': '00:00-00:02' + "\n" +
                         '00:04-00:02' + "\n" +
                         '00:04-00:06'
            },
            {
                'Text': 'sit|| amet|| consectetur',
                'Times': '00:06-00:08' + "\n" +
                         '00:08-00:10' + "\n" +
                         '00:10-00:12'
            }
        ]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'M04');
};

ModelValidationTests.prototype.testDuplicatedFrames = function() {
    var model = {
        'mp3': '/some/file.mp3',
        'Slides': [
            {
                'Text': 'Lorem|| Ipsum|| Dolor',
                'Times': '00:00-00:02' + "\n" +
                         '00:00-00:04' + "\n" +
                         '00:04-00:06'
            },
            {
                'Text': 'sit|| amet|| consectetur',
                'Times': '00:06-00:08' + "\n" +
                         '00:08-00:10' + "\n" +
                         '00:10-00:12'
            }
        ]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'M05');
};

ModelValidationTests.prototype.testVocabularyAudioFilesEmpty = function() {
    var model = {
        playSeparateFiles: "True",
        separateFiles: [{ mp3: "", ogg: "" }]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'SAF01');
};

ModelValidationTests.prototype.testVocabularyAudioFilesEmpty = function() {
    var model = {
        playSeparateFiles: "True",
        separateFiles: [{ mp3: "", ogg: "" }]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'SAF01');
};

ModelValidationTests.prototype.testVocabularyAudioFilesEmpty = function() {
    var audioObject = { mp3: "/some/file.mp3", ogg: "/some/file.ogg" };
    var model = {
        'Slides': [{
            'Text': 'Lorem|| Ipsum|| Dolor',
            'Times': "00:00-00:02\n00:02-00:04\n00:04-00:06"
        }, {
            'Text': 'sit|| amet|| consectetur',
            'Times': "00:06-00:08\n00:08-00:10\n00:10-00:12"
        }],
        playSeparateFiles: "True",
        separateFiles: [audioObject, audioObject, audioObject, audioObject, audioObject]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'SAF02');
};

ModelValidationTests.prototype.testVocabularyAudioFilesEmpty = function() {
    var audioObject = { mp3: "/some/file.mp3", ogg: "/some/file.ogg" };
    var model = {
        'Slides': [{
            'Text': 'Lorem|| Ipsum|| Dolor',
            'Times': "00:00-00:02\n00:02-00:04\n00:04-00:06"
        }, {
            'Text': 'sit|| amet|| consectetur',
            'Times': "00:06-00:08\n00:08-00:10\n00:10-00:12"
        }],
        playSeparateFiles: "True",
        separateFiles: [audioObject, audioObject, { mp3: "", ogg: "/some/file.ogg" }, audioObject, audioObject]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertFalse(validatedModel.isValid);
    assertEquals(validatedModel.errorCode, 'SAF03');
};

ModelValidationTests.prototype.testVocabularyAudioFilesEmpty = function() {
    var model = {
        'mp3': '/some/file.mp3',
        'Slides': [{
            'Text': 'Lorem',
            'Times': "00:00-00:02"
        }],
        playSeparateFiles: "",
        separateFiles: [{ mp3: "/some/file.mp3", ogg: "/some/file.ogg" }]
    };

    var validatedModel = this.presenter.validateModel(model);

    assertTrue(validatedModel.isValid);
    assertFalse(validatedModel.separateFiles);
};