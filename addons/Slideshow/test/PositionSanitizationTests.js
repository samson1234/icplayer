PositionSanitizationTests = TestCase("Position sanitization");

PositionSanitizationTests.prototype.testProperFormat = function() {
    var presenter = AddonSlideshow_create();
    
    var sanitizationResult = presenter.sanitizePosition("100");
    
    assertFalse(sanitizationResult.isError);
    assertEquals(100, sanitizationResult.position);
};

PositionSanitizationTests.prototype.testPositionUndefined = function() {
    var presenter = AddonSlideshow_create();
    
    var sanitizationResult = presenter.sanitizePosition();
    
    assertTrue(sanitizationResult.isError);
};

PositionSanitizationTests.prototype.testPositionEmptyString = function() {
    var presenter = AddonSlideshow_create();
    
    var sanitizationResult = presenter.sanitizePosition("");
    
    assertTrue(sanitizationResult.isError);
};

PositionSanitizationTests.prototype.testPositionNaN = function() {
    var presenter = AddonSlideshow_create();
    
    var sanitizationResult = presenter.sanitizePosition("kaka");
    
    assertTrue(sanitizationResult.isError);
};

PositionSanitizationTests.prototype.testPositionNegative = function() {
    var presenter = AddonSlideshow_create();
    
    var sanitizationResult = presenter.sanitizePosition("-10");
    
    assertTrue(sanitizationResult.isError);
};