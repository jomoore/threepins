/* Helper module to create HTML grids to interact with */
var Builder = (function() {
	var fixture = document.getElementById('qunit-fixture');

	/* Create a grid entirely with lights */
	var createEmpty = function(size) {
		for (var y = 0; y < size; y++) {
			for (var x = 0; x < size; x++) {
				var div = document.createElement('div');
				div.setAttribute('data-y', y);
				div.setAttribute('data-x', x);
				fixture.appendChild(div);
			}
		}
	};

	/* Create a grid consisting of an alternating block bordered with blocks */
	var createAlternating = function(outerSize, borderSize, keepEvens) {
		createEmpty(outerSize);
		var nodeList = fixture.querySelectorAll('div');
		for (var i = 0; i < nodeList.length; i++) {
			var y = nodeList[i].getAttribute('data-y');
			var x = nodeList[i].getAttribute('data-x');
			var lower = borderSize
			var upper = outerSize - borderSize - 1;

			if ((x < lower || y < lower) || (x > upper || y > upper) ||
				(y % 2 == keepEvens && x % 2 == keepEvens))
			{
				nodeList[i].classList.add('block');
			}
		}
	};

	/* Empty the fixture */
	var reset = function() {
		fixture.innerHTML = "";
	}

	return {
		fixture: fixture,
		createEmpty: createEmpty,
		createAlternating: createAlternating,
		reset: reset
	}
})();

QUnit.module("Builder functions");
QUnit.test("Build empty grids", function(assert) {
	for (var size = 3; size <= 15; size++)
	{
		Builder.createEmpty(size);

		var nodeList = Builder.fixture.querySelectorAll('div');
		assert.equal(nodeList.length, size * size, "Create empty grid size " + size);
		assert.equal(nodeList[0].getAttribute('data-y'), 0, "First y");
		assert.equal(nodeList[0].getAttribute('data-x'), 0, "First x");
		assert.equal(nodeList[1].getAttribute('data-y'), 0, "Second y");
		assert.equal(nodeList[1].getAttribute('data-x'), 1, "Second x");
		assert.equal(nodeList[size].getAttribute('data-y'), 1, "New row y");
		assert.equal(nodeList[size].getAttribute('data-x'), 0, "New row x");
		assert.equal(nodeList[nodeList.length - 1].getAttribute('data-y'), size - 1, "Last y");
		assert.equal(nodeList[nodeList.length - 1].getAttribute('data-x'), size - 1, "Last x");

		Builder.reset();
	}
});

QUnit.test("Build even grid", function(assert) {
	var size = 5;
	Builder.createAlternating(size, 0, 1);

	var nodeList = Builder.fixture.querySelectorAll('div');
	assert.equal(nodeList.length, size * size, "Create even grid size " + size);
	assert.notOk(nodeList[0].classList.contains('block'), "Row 0, Col 0");
	assert.notOk(nodeList[1].classList.contains('block'), "Row 0, Col 1");
	assert.notOk(nodeList[size].classList.contains('block'), "Row 1, Col 0");
	assert.ok(nodeList[size + 1].classList.contains('block'), "Row 1, Col 1");
	assert.notOk(nodeList[size + 2].classList.contains('block'), "Row 1, Col 2");
	assert.ok(nodeList[size + 3].classList.contains('block'), "Row 1, Col 3");
	assert.notOk(nodeList[size + 4].classList.contains('block'), "Row 1, Col 4");
	assert.notOk(nodeList[nodeList.length - 2].classList.contains('block'), "Row 4, Col 3");
	assert.notOk(nodeList[nodeList.length - 1].classList.contains('block'), "Row 4, Col 4");
});

QUnit.test("Build odd grid", function(assert) {
	var size = 5;
	Builder.createAlternating(size, 0, 0);

	var nodeList = Builder.fixture.querySelectorAll('div');
	assert.equal(nodeList.length, size * size, "Create odd grid size " + size);
	assert.ok(nodeList[0].classList.contains('block'), "Row 0, Col 0");
	assert.notOk(nodeList[1].classList.contains('block'), "Row 0, Col 1");
	assert.ok(nodeList[2].classList.contains('block'), "Row 0, Col 2");
	assert.notOk(nodeList[3].classList.contains('block'), "Row 0, Col 3");
	assert.ok(nodeList[4].classList.contains('block'), "Row 0, Col 4");
	assert.notOk(nodeList[size].classList.contains('block'), "Row 1, Col 0");
	assert.notOk(nodeList[size + 1].classList.contains('block'), "Row 1, Col 1");
	assert.notOk(nodeList[nodeList.length - 2].classList.contains('block'), "Row 4, Col 3");
	assert.ok(nodeList[nodeList.length - 1].classList.contains('block'), "Row 4, Col 4");
});

QUnit.test("Build bordered even grid", function(assert) {
	var size = 5;
	Builder.createAlternating(size, 1 , 1);

	var nodeList = Builder.fixture.querySelectorAll('div');
	assert.equal(nodeList.length, size * size, "Create bordered even grid size " + size);
	assert.ok(nodeList[0].classList.contains('block'), "Row 0, Col 0");
	assert.ok(nodeList[1].classList.contains('block'), "Row 0, Col 1");
	assert.ok(nodeList[4].classList.contains('block'), "Row 0, Col 4");
	assert.ok(nodeList[size].classList.contains('block'), "Row 1, Col 0");
	assert.ok(nodeList[size + 1].classList.contains('block'), "Row 1, Col 1");
	assert.notOk(nodeList[size + 2].classList.contains('block'), "Row 1, Col 2");
	assert.ok(nodeList[size + 3].classList.contains('block'), "Row 1, Col 3");
	assert.ok(nodeList[size + 4].classList.contains('block'), "Row 1, Col 4");
	assert.ok(nodeList[2 * size].classList.contains('block'), "Row 2, Col 0");
	assert.notOk(nodeList[2 * size + 1].classList.contains('block'), "Row 2, Col 1");
	assert.notOk(nodeList[2 * size + 2].classList.contains('block'), "Row 2, Col 2");
	assert.notOk(nodeList[2 * size + 3].classList.contains('block'), "Row 2, Col 3");
	assert.ok(nodeList[2 * size + 4].classList.contains('block'), "Row 2, Col 4");
	assert.ok(nodeList[nodeList.length - 2].classList.contains('block'), "Row 4, Col 3");
	assert.ok(nodeList[nodeList.length - 1].classList.contains('block'), "Row 4, Col 4");
});

QUnit.test("Build bordered odd grid", function(assert) {
	var size = 5;
	Builder.createAlternating(size, 1 , 0);

	var nodeList = Builder.fixture.querySelectorAll('div');
	assert.equal(nodeList.length, size * size, "Create bordered odd grid size " + size);
	assert.ok(nodeList[0].classList.contains('block'), "Row 0, Col 0");
	assert.ok(nodeList[1].classList.contains('block'), "Row 0, Col 1");
	assert.ok(nodeList[4].classList.contains('block'), "Row 0, Col 4");
	assert.ok(nodeList[size].classList.contains('block'), "Row 1, Col 0");
	assert.notOk(nodeList[size + 1].classList.contains('block'), "Row 1, Col 1");
	assert.notOk(nodeList[size + 2].classList.contains('block'), "Row 1, Col 2");
	assert.notOk(nodeList[size + 3].classList.contains('block'), "Row 1, Col 3");
	assert.ok(nodeList[size + 4].classList.contains('block'), "Row 1, Col 4");
	assert.ok(nodeList[2 * size].classList.contains('block'), "Row 2, Col 0");
	assert.notOk(nodeList[2 * size + 1].classList.contains('block'), "Row 2, Col 1");
	assert.ok(nodeList[2 * size + 2].classList.contains('block'), "Row 2, Col 2");
	assert.notOk(nodeList[2 * size + 3].classList.contains('block'), "Row 2, Col 3");
	assert.ok(nodeList[2 * size + 4].classList.contains('block'), "Row 2, Col 4");
	assert.ok(nodeList[nodeList.length - 2].classList.contains('block'), "Row 4, Col 3");
	assert.ok(nodeList[nodeList.length - 1].classList.contains('block'), "Row 4, Col 4");
});
