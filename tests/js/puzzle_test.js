/* Helper module to create HTML grids to interact with */
var Builder = (function() {
	var fixture = document.getElementById('qunit-fixture');

	/* Set clue numbers at the start of each entry */
	var setNumbers = function(size, nodeList) {
		var number = 1;
		for (var i = 0; i < nodeList.length; i++) {
			var headAcross = (!nodeList[i].classList.contains('block') && 
							  (i % size < size - 1) && !nodeList[i + 1].classList.contains('block') &&
							  (i % size == 0 || nodeList[i - 1].classList.contains('block')));
			var headDown = (!nodeList[i].classList.contains('block') &&
							(i < size * (size - 1)) && !nodeList[i + size].classList.contains('block') &&
							(i < size || nodeList[i - size].classList.contains('block')));
			if (headAcross || headDown) {
				var div = document.createElement('div');
				div.innerHTML = number;
				div.classList.add('grid-number');
				nodeList[i].appendChild(div);
				number++;
			}
			else
				nodeList[i].innerHtml = '';
		}
	};

	/* Create a grid entirely with lights */
	var createEmpty = function(size) {
		localStorage.removeItem('solve-Cyborg-1');
		for (var y = 0; y < size; y++) {
			for (var x = 0; x < size; x++) {
				var div = document.createElement('div');
				div.setAttribute('data-y', y);
				div.setAttribute('data-x', x);
				div.setAttribute('data-a', 'A');
				fixture.appendChild(div);
			}
		}
		
		return document.querySelectorAll('#qunit-fixture > div');
	};

	/* Create a grid with lights in alternating rows and columns */
	var createAlternating = function(size, keepEvens) {
		var nodeList = createEmpty(size);

		var elList = fixture.children;
		for (var i = 0; i < elList.length; i++) {
			var y = elList[i].getAttribute('data-y');
			var x = elList[i].getAttribute('data-x');
			if (y % 2 == keepEvens && x % 2 == keepEvens) {
				elList[i].classList.add('block');
			}
			else {
				elList[i].classList.add('light');
			}
		}

		setNumbers(size, nodeList);
		return nodeList;
	};

	/* Block out an entire row of the grid */
	var blockRow = function(row, size, nodeList) {
		for (var x = 0; x < size; x++) {
			nodeList[row * size + x].classList.add('block');
		}

		setNumbers(size, nodeList);
	};

	/* Block out an entire column of the grid */
	var blockCol = function(col, size, nodeList) {
		for (var y = 0; y < size; y++) {
			nodeList[y * size + col].classList.add('block');
		}

		setNumbers(size, nodeList);
	};

	/* Empty the fixture */
	var reset = function() {
		fixture.innerHTML = '';
	};

	return {
		fixture: fixture,
		createEmpty: createEmpty,
		createAlternating: createAlternating,
		blockRow: blockRow,
		blockCol: blockCol,
		reset: reset
	};
})();

QUnit.assert.equalCoord = function(div, expected, message) {
	var coord = {x: div.getAttribute('data-x'), y: div.getAttribute('data-y')};
	this.push(coord.x == expected.x && coord.y == expected.y, coord, expected, message);
};

QUnit.assert.block = function(div, message) {
	var block = div.classList.contains('block');
	this.push(block, block, true, message);
};

QUnit.assert.light = function(div, message) {
	var block = div.classList.contains('block');
	this.push(!block, !block, true, message);
};

QUnit.assert.numbered = function(div, message) {
	var number = div.querySelector('.grid-number');
	this.push(number != null, number != null, true, message);
};

QUnit.assert.notNumbered = function(div, message) {
	var number = div.querySelector('.grid-number');
	this.push(number == null, number == null, true, message);
};

QUnit.assert.target = function(div, message) {
	var target = div.classList.contains('target');
	this.push(target, target, true, message);
};

QUnit.assert.highlighted = function(div, message) {
	var highlighted = div.classList.contains('highlight');
	this.push(highlighted, highlighted, true, message);
};

QUnit.assert.notHighlighted = function(div, message) {
	var target = div.classList.contains('target');
	var highlighted = div.classList.contains('highlight');
	this.push(!target && !highlighted,
			  {target: target, highlighted: highlighted}, 
			  {target: false, highlighted: false},
			  message);
};

QUnit.assert.letterEqual = function(div, expectedLetter, message) {
	var actualLetter = div.querySelector('.letter').innerHTML;
	this.push(actualLetter == expectedLetter, actualLetter, expectedLetter, message);
};

QUnit.assert.noLetter = function(div, message) {
	var letter = div.querySelector('.letter');
	this.push(letter == null, letter, null, message);
};

// Add a helper function to our nodeLists so that we can get elements by co-ordinate.
// Not compatible with all browsers, but this isn't public-facing code.
NodeList.prototype.gridItem = function(x, y) {
	return this.item(y * Math.sqrt(this.length) + x);
};

QUnit.module('Builder functions');
QUnit.test('Map node list to co-ordinates', function(assert) {
	for (var size = 3; size <= 15; size++)
	{
		var nodeList = Builder.createEmpty(size);

		assert.equal(nodeList.length, size * size, 'Create empty grid size ' + size);
		assert.equalCoord(nodeList.gridItem(0, 0), {x: 0, y: 0}, 'First cell');
		assert.equalCoord(nodeList.gridItem(1, 0), {x: 1, y: 0}, 'Second cell');
		assert.equalCoord(nodeList.gridItem(0, 1), {x: 0, y: 1}, 'Second row');
		assert.equalCoord(nodeList.gridItem(1, 2), {x: 1, y: 2}, 'Third row');
		assert.equalCoord(nodeList.gridItem(size - 1, size - 1), {x: size - 1, y: size - 1}, 'Last cell');

		Builder.reset();
	}
});

QUnit.test('Build even grid', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var i;

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, 'Create even grid size ' + size);
	assert.light(nodeList.gridItem(0, 0), 'Row 0, Col 0');
	assert.light(nodeList.gridItem(1, 0), 'Row 0, Col 1');
	assert.light(nodeList.gridItem(0, 1), 'Row 1, Col 0');
	assert.block(nodeList.gridItem(1, 1), 'Row 1, Col 1');
	assert.light(nodeList.gridItem(2, 1), 'Row 1, Col 2');
	assert.block(nodeList.gridItem(3, 1), 'Row 1, Col 3');
	assert.light(nodeList.gridItem(4, 1), 'Row 1, Col 4');
	assert.light(nodeList.gridItem(3, 4), 'Row 4, Col 3');
	assert.light(nodeList.gridItem(4, 4), 'Row 4, Col 4');

	/* Check clue numbers */
	for (i = 0; i < size; i++) {
		if (i % 2 == 0)
			assert.numbered(nodeList[i], 'Down entry numbered');
		else
			assert.notNumbered(nodeList[i], 'No number');
	}

	for (i = 0; i < size * size; i += size) {
		if (i % 2 == 0)
			assert.numbered(nodeList[i], 'Across entry numbered');
		else
			assert.notNumbered(nodeList[i], 'No number');
	}
});

QUnit.test('Build odd grid', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	var i;

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, 'Create odd grid size ' + size);
	assert.block(nodeList.gridItem(0, 0), 'Row 0, Col 0');
	assert.light(nodeList.gridItem(1, 0), 'Row 0, Col 1');
	assert.block(nodeList.gridItem(2, 0), 'Row 0, Col 2');
	assert.light(nodeList.gridItem(3, 0), 'Row 0, Col 3');
	assert.block(nodeList.gridItem(4, 0), 'Row 0, Col 4');
	assert.light(nodeList.gridItem(0, 1), 'Row 1, Col 0');
	assert.light(nodeList.gridItem(1, 1), 'Row 1, Col 1');
	assert.light(nodeList.gridItem(3, 4), 'Row 4, Col 3');
	assert.block(nodeList.gridItem(4, 4), 'Row 4, Col 4');

	/* Check clue numbers */
	for (i = 0; i < size; i++) {
		if (i % 2 == 1)
			assert.numbered(nodeList[i], 'Down entry numbered');
		else
			assert.notNumbered(nodeList[i], 'No number');
	}

	for (i = 0; i < size * size; i += size) {
		if (i % 2 == 1)
			assert.numbered(nodeList[i], 'Across entry numbered');
		else
			assert.notNumbered(nodeList[i], 'No number');
	}
});

QUnit.test('Build bordered even grid', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	Builder.blockRow(0, size, nodeList);
	Builder.blockRow(size - 1, size, nodeList);
	Builder.blockCol(0, size, nodeList);
	Builder.blockCol(size - 1, size, nodeList);

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, 'Create bordered even grid size ' + size);
	assert.block(nodeList.gridItem(0, 0), 'Row 0, Col 0');
	assert.block(nodeList.gridItem(1, 0), 'Row 0, Col 1');
	assert.block(nodeList.gridItem(4, 0), 'Row 0, Col 4');
	assert.block(nodeList.gridItem(0, 1), 'Row 1, Col 0');
	assert.block(nodeList.gridItem(1, 1), 'Row 1, Col 1');
	assert.light(nodeList.gridItem(2, 1), 'Row 1, Col 2');
	assert.block(nodeList.gridItem(3, 1), 'Row 1, Col 3');
	assert.block(nodeList.gridItem(4, 1), 'Row 1, Col 4');
	assert.block(nodeList.gridItem(0, 2), 'Row 2, Col 0');
	assert.light(nodeList.gridItem(1, 2), 'Row 2, Col 1');
	assert.light(nodeList.gridItem(2, 2), 'Row 2, Col 2');
	assert.light(nodeList.gridItem(3, 2), 'Row 2, Col 3');
	assert.block(nodeList.gridItem(4, 2), 'Row 2, Col 4');
	assert.block(nodeList.gridItem(3, 4), 'Row 4, Col 3');
	assert.block(nodeList.gridItem(4, 4), 'Row 4, Col 4');

	/* Check clue numbers */
	assert.numbered(nodeList.gridItem(2, 1), 'Down entry numbered');
	assert.numbered(nodeList.gridItem(1, 2), 'Across entry numbered');
});

QUnit.test('Build bordered odd grid', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	Builder.blockRow(0, size, nodeList);
	Builder.blockRow(size - 1, size, nodeList);
	Builder.blockCol(0, size, nodeList);
	Builder.blockCol(size - 1, size, nodeList);

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, 'Create bordered odd grid size ' + size);
	assert.block(nodeList.gridItem(0, 0), 'Row 0, Col 0');
	assert.block(nodeList.gridItem(1, 0), 'Row 0, Col 1');
	assert.block(nodeList.gridItem(4, 0), 'Row 0, Col 4');
	assert.block(nodeList.gridItem(0, 1), 'Row 1, Col 0');
	assert.light(nodeList.gridItem(1, 1), 'Row 1, Col 1');
	assert.light(nodeList.gridItem(2, 1), 'Row 1, Col 2');
	assert.light(nodeList.gridItem(3, 1), 'Row 1, Col 3');
	assert.block(nodeList.gridItem(4, 1), 'Row 1, Col 4');
	assert.block(nodeList.gridItem(0, 2), 'Row 2, Col 0');
	assert.light(nodeList.gridItem(1, 2), 'Row 2, Col 1');
	assert.block(nodeList.gridItem(2, 2), 'Row 2, Col 2');
	assert.light(nodeList.gridItem(3, 2), 'Row 2, Col 3');
	assert.block(nodeList.gridItem(4, 2), 'Row 2, Col 4');
	assert.block(nodeList.gridItem(3, 4), 'Row 4, Col 3');
	assert.block(nodeList.gridItem(4, 4), 'Row 4, Col 4');

	/* Check clue numbers */
	assert.numbered(nodeList.gridItem(1, 1), 'Down entry numbered');
	assert.numbered(nodeList.gridItem(3, 1), 'Down entry numbered');
	assert.numbered(nodeList.gridItem(1, 3), 'Across entry numbered');
});

QUnit.module('Grid selection');

// Helper to create a grid and load its content from the page
var createGrid = function(size, fixture) {
	var grid = new GridModule.Grid(size);
	grid.loadGrid(fixture, 'solve-Cyborg-1');
	grid.loadLetters();
	return grid;
};

QUnit.test('Move target to across entry', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var col = 0; col < 2; col++) {
		for (var target = col; target < size * size; target += 2 * size) {
			grid.activateClicked(nodeList[target]);
			for (var n = 0; n < nodeList.length; n++) {
				if (n == target)
					assert.target(nodeList[target], 'Target ' + target);
				else if ((n - n % size) / size == (target - col) / size)
					assert.highlighted(nodeList[n], 'Highlight - Row ' + ((target - col) / size));
				else
					assert.notHighlighted(nodeList[n], 'No highlight');
			}
		}
	}
});

QUnit.test('Move target to down entry', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var row = 0; row < 2; row++) {
		for (var target = row * size; target < 2 * row * size; target += 2) {
			grid.activateClicked(nodeList[target]);
			if (target != 0) { // Selects the across entry in preference
				for (var n = 0; n < nodeList.length; n++) {
					if (n == target)
						assert.target(nodeList[target], 'Target ' + target);
					else if (n % size == target % size)
						assert.highlighted(nodeList[n], 'Highlight - Col ' + (target % size));
					else
						assert.notHighlighted(nodeList[n], 'No highlight');
				}
			}
		}
	}
});


QUnit.test('Move target within across entry', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var target = 0; target < size; target++) {
		// Avoid clicking numbered squares which will select down entries
		if (nodeList[target].querySelector('.grid-number') == null || target == 0)
		{
			grid.activateClicked(nodeList[target]);
			for (var n = 0; n < nodeList.length; n++) {
				if (n == target)
					assert.target(nodeList[target], 'Target ' + target);
				else if (n < size)
					assert.highlighted(nodeList[n], 'Highlight - Row 0');
				else
					assert.notHighlighted(nodeList[n], 'No highlight');
			}
		}
	}
});

QUnit.test('Move target within down entry', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var target = 0; target < size * size; target += size) {
		// Avoid clicking numbered squares which will select across entries
		if (nodeList[target].querySelector('.grid-number') == null)
		{
			grid.activateClicked(nodeList[target]);

			for (var n = 0; n < nodeList.length; n++) {
				if (n == target)
					assert.target(nodeList[target], 'Target ' + target);
				else if (n % size == 0)
					assert.highlighted(nodeList[n], 'Highlight - Col 0');
				else
					assert.notHighlighted(nodeList[n], 'No highlight');
			}
		}
	}
});

QUnit.test('Toggle across/down @ (0, 0)', function(assert) {
	var size = 5;
	var n;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var i = 0; i < 2; i++) {
		/* Select first cell - across entry should be highlighted */
		grid.activateClicked(nodeList.gridItem(0, 0));
		assert.target(nodeList.gridItem(0, 0), 'Target - Row 0, Col 0');
		for (n = 1; n < nodeList.length; n++) {
			if (n < size)
				assert.highlighted(nodeList[n], 'Highlight - Row 0, Col ' + n);
			else
				assert.notHighlighted(nodeList[n], 'No highlight');
		}

		/* Select again - down entry should be highlighted */
		grid.activateClicked(nodeList.gridItem(0, 0));
		assert.target(nodeList.gridItem(0, 0), 'Target - Row 0, Col 0)');
		for (n = 1; n < nodeList.length; n++) {
			if (n % size == 0)
				assert.highlighted(nodeList[n], 'Highlight - Row ' + (n / size) + ', Col 0');
			else
				assert.notHighlighted(nodeList[n], 'No highlight');
		}
	}
});

QUnit.test('Toggle across/down @ (0, 2)', function(assert) {
	var size = 5;
	var n;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var i = 0; i < 2; i++) {
		grid.activateClicked(nodeList.gridItem(0, 2));
		for (n = 0; n < nodeList.length; n++) {
			if (n == 2 * size)
				assert.target(nodeList[n], 'Target - Row 2, Col 0)');
			else if (n > 2 * size & n < 3 * size)
				assert.highlighted(nodeList[n], 'Highlight - Row 2, Col ' + (n % size));
			else
				assert.notHighlighted(nodeList[n], 'No highlight');
		}

		grid.activateClicked(nodeList.gridItem(0, 2));
		for (n = 0; n < nodeList.length; n++) {
			if (n == 2 * size)
				assert.target(nodeList[n], 'Target - Row 2, Col 0)');
			else if (n % size == 0)
				assert.highlighted(nodeList[n], 'Highlight - Row ' + (n / size) + ', Col 0');
			else
				assert.notHighlighted(nodeList[n], 'No highlight');
		}
	}
});

QUnit.test('Toggle across/down @ (2, 2)', function(assert) {
	var size = 5;
	var n;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	for (var i = 0; i < 2; i++) {
		grid.activateClicked(nodeList.gridItem(2, 2));
		for (n = 0; n < nodeList.length; n++) {
			if (n == 2 * size + 2)
				assert.target(nodeList[n], 'Target - Row 2, Col 2)');
			else if (n >= 2 * size & n < 3 * size)
				assert.highlighted(nodeList[n], 'Highlight - Row 2, Col ' + (n % size));
			else
				assert.notHighlighted(nodeList[n], 'No highlight');
		}

		grid.activateClicked(nodeList.gridItem(2, 2));
		for (n = 0; n < nodeList.length; n++) {
			if (n == 2 * size + 2)
				assert.target(nodeList[n], 'Target - Row 2, Col 2)');
			else if (n % size == 2)
				assert.highlighted(nodeList[n], 'Highlight - Row ' + ((n - n % size) / size) + ', Col 2');
			else
				assert.notHighlighted(nodeList[n], 'No highlight');
		}
	}
});

QUnit.test('Select next', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 1));
	assert.target(nodeList.gridItem(0, 1), 'First across entry');

	grid.activateNext();
	assert.target(nodeList.gridItem(0, 3), 'Second across entry');

	grid.activateNext();
	assert.target(nodeList.gridItem(1, 0), 'First down entry');

	grid.activateNext();
	assert.target(nodeList.gridItem(3, 0), 'Second down entry');

	grid.activateNext();
	assert.target(nodeList.gridItem(0, 1), 'First across entry');
});

QUnit.test('Select previous', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 1));
	assert.target(nodeList.gridItem(0, 1), 'First across entry');

	grid.activatePrevious();
	assert.target(nodeList.gridItem(3, 0), 'Second down entry');

	grid.activatePrevious();
	assert.target(nodeList.gridItem(1, 0), 'First down entry');

	grid.activatePrevious();
	assert.target(nodeList.gridItem(0, 3), 'Second across entry');

	grid.activatePrevious();
	assert.target(nodeList.gridItem(0, 1), 'First across entry');
});

QUnit.test('Move target within grid limits', function(assert) {
	var size = 3;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.target(nodeList.gridItem(0, 0), 'Initial selection');

	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(0, 0), 'No change');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(0, 0), 'No change');
	grid.moveTarget(1, 0);
	assert.target(nodeList.gridItem(1, 0), 'Step right');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(1, 0), 'No change');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(1, 0), 'No change');
	grid.moveTarget(1, 0);
	assert.target(nodeList.gridItem(2, 0), 'Step right');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(2, 0), 'No change');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(2, 1), 'Step down');
	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(2, 1), 'No change');
	grid.moveTarget(1, 0);
	assert.target(nodeList.gridItem(2, 1), 'No change');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(2, 2), 'Step down');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(2, 2), 'No change');
	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(1, 2), 'Step left');
	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(0, 2), 'Step left');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(0, 1), 'Step up');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(0, 0), 'Step up');
});

QUnit.test('Move target within blocks', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	Builder.blockRow(0, size, nodeList);
	Builder.blockRow(size - 1, size, nodeList);
	Builder.blockCol(0, size, nodeList);
	Builder.blockCol(size - 1, size, nodeList);

	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(1, 1));
	assert.target(nodeList.gridItem(1, 1), 'Initial selection');

	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(1, 1), 'No change');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(1, 1), 'No change');
	grid.moveTarget(1, 0);
	assert.target(nodeList.gridItem(2, 1), 'Step right');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(2, 1), 'No change');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(2, 1), 'No change');
	grid.moveTarget(1, 0);
	assert.target(nodeList.gridItem(3, 1), 'Step right');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(3, 1), 'No change');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(3, 2), 'Step down');
	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(3, 2), 'No change');
	grid.moveTarget(1, 0);
	assert.target(nodeList.gridItem(3, 2), 'No change');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(3, 3), 'Step down');
	grid.moveTarget(0, 1);
	assert.target(nodeList.gridItem(3, 3), 'No change');
	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(2, 3), 'Step left');
	grid.moveTarget(-1, 0);
	assert.target(nodeList.gridItem(1, 3), 'Step left');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(1, 2), 'Step up');
	grid.moveTarget(0, -1);
	assert.target(nodeList.gridItem(1, 1), 'Step up');
});

QUnit.module('Text entry');
QUnit.test('Add text', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.target(nodeList.gridItem(0, 0), 'Initial selection');

	grid.updateLetters('...', '...a');
	grid.updateLetters('...a', '...ab');
	grid.updateLetters('...ab', '...abcd');
	grid.updateLetters('...abcd', '...abcd');
	grid.updateLetters('...abcd', '...abcde');
	grid.updateLetters('...abcde', '...abcdef');

	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Content A');
	assert.letterEqual(nodeList.gridItem(1, 0), 'B', 'Content B');
	assert.letterEqual(nodeList.gridItem(2, 0), 'C', 'Content C');
	assert.letterEqual(nodeList.gridItem(3, 0), 'D', 'Content D');
	assert.letterEqual(nodeList.gridItem(4, 0), 'F', 'Content F');
});

QUnit.test('Delete text', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	/* Set up some text to delete */
	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.target(nodeList.gridItem(0, 0), 'Initial selection');
	grid.updateLetters('...', '...abcde');
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Content A');
	assert.letterEqual(nodeList.gridItem(1, 0), 'B', 'Content B');
	assert.letterEqual(nodeList.gridItem(2, 0), 'C', 'Content C');

	/* Deleted upwards starting from an empty square */
	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.updateLetters('...', '..');
	assert.target(nodeList.gridItem(0, 0), 'Backspace from empty square');
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'First square has letter');
	grid.updateLetters('..', '.');
	assert.target(nodeList.gridItem(0, 0), 'Backspace from first square');
	assert.noLetter(nodeList.gridItem(0, 0), 'First letter deleted');
	grid.updateLetters('.', '');
	assert.target(nodeList.gridItem(0, 0), 'No change');

	/* Deleted leftwards starting from a populated square */
	grid.activateClicked(nodeList.gridItem(2, 0));
	grid.activateClicked(nodeList.gridItem(2, 0));
	grid.updateLetters('...', '..');
	assert.target(nodeList.gridItem(1, 0), 'Backspace from populated square');
	assert.noLetter(nodeList.gridItem(2, 0), 'Backspace from populated square');
	grid.updateLetters('..', '.');
	assert.target(nodeList.gridItem(0, 0), 'Second backspace from populated square');
	assert.noLetter(nodeList.gridItem(1, 0), 'Second backspace from populated square');
});

QUnit.test('Replace text', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	/* Set up some text */
	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.target(nodeList.gridItem(0, 0), 'Initial selection');
	grid.updateLetters('...', '...abc');
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Content A');
	assert.letterEqual(nodeList.gridItem(1, 0), 'B', 'Content B');
	assert.letterEqual(nodeList.gridItem(2, 0), 'C', 'Content C');

	/* Change the last letter */
	grid.updateLetters('...abc', '...abd');
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'First letter preserved');
	assert.letterEqual(nodeList.gridItem(1, 0), 'B', 'Second letter preserved');
	assert.letterEqual(nodeList.gridItem(2, 0), 'D', 'Third letter updated');
});

QUnit.test('Check answer', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.updateLetters('', 'aabba');
	grid.checkAnswer();
	
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Correct letter');
	assert.letterEqual(nodeList.gridItem(1, 0), 'A', 'Correct letter');
	assert.noLetter(nodeList.gridItem(2, 0), 'Incorrect letter');
	assert.noLetter(nodeList.gridItem(3, 0), 'Incorrect letter');
	assert.letterEqual(nodeList.gridItem(4, 0), 'A', 'Correct letter');
});

QUnit.test('Check all', function (assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.updateLetters('', 'aabba');
	grid.activateClicked(nodeList.gridItem(0, 2));
	grid.updateLetters('', 'aabba');
	grid.checkAll();

	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Correct letter');
	assert.letterEqual(nodeList.gridItem(1, 0), 'A', 'Correct letter');
	assert.noLetter(nodeList.gridItem(2, 0), 'Incorrect letter');
	assert.noLetter(nodeList.gridItem(3, 0), 'Incorrect letter');
	assert.letterEqual(nodeList.gridItem(4, 0), 'A', 'Correct letter');

	assert.letterEqual(nodeList.gridItem(0, 2), 'A', 'Correct letter');
	assert.letterEqual(nodeList.gridItem(1, 2), 'A', 'Correct letter');
	assert.noLetter(nodeList.gridItem(2, 2), 'Incorrect letter');
	assert.noLetter(nodeList.gridItem(3, 2), 'Incorrect letter');
	assert.letterEqual(nodeList.gridItem(4, 2), 'A', 'Correct letter');
});

QUnit.test('Show answer', function(assert) {
	var size = 5;
	var i;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.clearAll();
	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.showAnswer();

	for (i = 0; i < size; i++) {
		assert.letterEqual(nodeList[i], 'A', 'Revealed letter');
	}

	for (i = 2 * size; i < 3 * size; i++) {
		assert.noLetter(nodeList[i], 'No revealed letter');
	}
});

QUnit.test('Show solution', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.showSolution();

	for (var i = 0; i < size * size; i++) {
		if (nodeList[i].getAttribute('data-x') % 2 == 0 ||
			nodeList[i].getAttribute('data-y') % 2 == 0) {
			assert.letterEqual(nodeList[i], 'A', 'Revealed letter');
		} else {
			assert.block(nodeList[i], 'Block');
		}
	}
});

QUnit.test('Clear all', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.target(nodeList.gridItem(0, 0), 'Initial selection');
	grid.updateLetters('...', '...abcde');
	grid.clearAll();

	for (var i = 0; i < size * size; i++) {
		assert.noLetter(nodeList[i], 'Grid empty');
	}
});

QUnit.module('Grid-fill');
QUnit.test('Get clue data', function(assert) {
	var size = 5;
	Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	var clueData = grid.getClueData();
	assert.deepEqual(clueData.across, [{x: 0, y: 0, clueNum: '1', wordLen: 5},
									   {x: 0, y: 2, clueNum: '4', wordLen: 5},
									   {x: 0, y: 4, clueNum: '5', wordLen: 5}],
					 'Across clue data matches');
	assert.deepEqual(clueData.down, [{x: 0, y: 0, clueNum: '1', wordLen: 5},
									 {x: 2, y: 0, clueNum: '2', wordLen: 5},
									 {x: 4, y: 0, clueNum: '3', wordLen: 5}],
					 'Down clue data matches');
});

QUnit.test('Get text', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');
	
	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.updateLetters('...', '...HI');
	grid.activateClicked(nodeList.gridItem(3, 0));
	grid.updateLetters('...', '...MA');

	var entry = grid.getActiveEntry();
	assert.equal(entry, 'HI.MA', 'Got active text');
});

QUnit.test('Get checkers', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(1, 0));
	grid.setActiveEntry('FROGS');
	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.setActiveEntry('FLAME');
	grid.activateClicked(nodeList.gridItem(2, 1));
	grid.setActiveEntry('OGLES');
	grid.activateClicked(nodeList.gridItem(4, 1));
	grid.setActiveEntry('SHRUB');

	grid.activateClicked(nodeList.gridItem(1, 0));
	var entry = grid.getActiveCheckers();
	assert.equal(entry, 'F.O.S');
});

QUnit.test('Get index', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');
	
	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.equal(grid.getActiveIndex(), 0, 'First across');
	assert.equal(grid.getActiveDirection(), false, 'Correct direction');
	grid.activateClicked(nodeList.gridItem(0, 2));
	assert.equal(grid.getActiveIndex(), 1, 'Second across');
	assert.equal(grid.getActiveDirection(), false, 'Correct direction');
	grid.activateClicked(nodeList.gridItem(0, 1));
	assert.equal(grid.getActiveIndex(), 0, 'First down');
	assert.equal(grid.getActiveDirection(), true, 'Correct direction');
	grid.activateClicked(nodeList[size - 1]);
	assert.equal(grid.getActiveIndex(), 2, 'Third down');
	assert.equal(grid.getActiveDirection(), true, 'Correct direction');
});

QUnit.test('Set text', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');
	
	grid.activateClicked(nodeList.gridItem(1, 0));
	grid.setActiveEntry('FROGS');
	assert.letterEqual(nodeList.gridItem(0, 0), 'F', 'First letter set');
	assert.letterEqual(nodeList.gridItem(4, 0), 'S', 'Last letter set');
});

QUnit.test('Reset text', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');
	
	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.setActiveEntry('FROGS');
	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.setActiveEntry('FLAME');
	grid.activateClicked(nodeList.gridItem(1, 0));
	grid.resetActiveEntry();

	assert.letterEqual(nodeList.gridItem(0, 0), 'F', 'Checked letter preserved');
	assert.noLetter(nodeList.gridItem(1, 0), 'Unchecked letter removed');
	assert.noLetter(nodeList[size - 1], 'Unchecked letter removed');

	grid.activateClicked(nodeList[size * 2 + 1]);
	grid.setActiveEntry('APPLE');
	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.resetActiveEntry();

	assert.noLetter(nodeList.gridItem(0, 0), 'Unchecked letter removed');
	assert.letterEqual(nodeList[size * 2], 'A', 'Checked letter preserved');
	assert.noLetter(nodeList[size * (size - 1)], 'Unchecked letter removed');
});

QUnit.test('Get ipuz puzzle', function(assert) {
	var size = 5;
	Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	var puzzle = grid.getIpuzPuzzle();
	assert.deepEqual(puzzle, [[1, 0, 2, 0, 3],
							  [0, '#', 0, '#', 0],
							  [4, 0, 0, 0, 0],
							  [0, '#', 0, '#', 0],
							  [5, 0, 0, 0, 0]]);

});

QUnit.test('Change listener', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var callCount = 0;
	var expectedCount = 0;
	var changeType;

	var listener = function(c) {
		++callCount;
		changeType = c;
	};

	var grid = new GridModule.Grid(size, listener);
	grid.loadGrid(Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(1, 0));
	assert.equal(callCount, ++expectedCount, 'Listener called on initial selection');
	assert.equal(changeType, 'move', 'Change type move');
	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.equal(callCount, expectedCount, 'Listener not called when selecting square within the same entry');
	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.equal(callCount, ++expectedCount, 'Listener called when selection changes to down entry');
	assert.equal(changeType, 'move', 'Change type move');
	grid.activateClicked(nodeList.gridItem(4, 0));
	assert.equal(callCount, ++expectedCount, 'Listener called when selection changes to entirely different entry');
	assert.equal(changeType, 'move', 'Change type move');

	grid.updateLetters('...', '...H');
	assert.equal(callCount, ++expectedCount, 'Listener called when text is added');
	assert.equal(changeType, 'text', 'Change type text');
	grid.updateLetters('...', '..');
	assert.equal(callCount, expectedCount, 'Listener not called when no text is removed');
	grid.updateLetters('...', '..');
	assert.equal(callCount, ++expectedCount, 'Listener called when text is removed');
	assert.equal(changeType, 'text', 'Change type text');

	grid.activatePrevious();
	assert.equal(callCount, ++expectedCount, 'Listener called when moving to previous entry');
	assert.equal(changeType, 'move', 'Change type move');
	grid.activateNext();
	assert.equal(callCount, ++expectedCount, 'Listener called when moving to next entry');
	assert.equal(changeType, 'move', 'Change type move');
	grid.clearActive();				 
	assert.equal(callCount, ++expectedCount, 'Listener called when clearing entry');
	assert.equal(changeType, 'move', 'Change type move');
	grid.activateClicked(nodeList.gridItem(1,1));
	assert.equal(callCount, ++expectedCount, 'Listener called when clearing entry by clicking a block');
	assert.equal(changeType, 'move', 'Change type move');

	grid.activateClicked(nodeList.gridItem(0, 0));
	assert.equal(callCount, ++expectedCount, 'Reset to known position');
	grid.moveTarget(0, 1);
	assert.equal(callCount, ++expectedCount, 'Listener called on arrow key move to different entry');
	assert.equal(changeType, 'move', 'Change type move');
	grid.moveTarget(0, 1);
	assert.equal(callCount, expectedCount, 'Listener not called on arrow key within an entry');

	grid.updateLetters('...', '...A');
	assert.equal(callCount, ++expectedCount, 'Add a letter to delete');
	grid.deleteTargetLetter(true);
	assert.equal(callCount, expectedCount, 'Listener not called when there is no letter to delete');
	grid.deleteTargetLetter(true);
	assert.equal(callCount, ++expectedCount, 'Listener called when there is a letter to delete');
	assert.equal(changeType, 'text', 'Change type text');

	grid.setActiveEntry('LATHE');
	assert.equal(callCount, expectedCount, 'Listener not called on setActiveEntry');
	grid.resetActiveEntry();
	assert.equal(callCount, expectedCount, 'Listener not called on resetActiveEntry');
});

QUnit.test('Get ipuz solution', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.setActiveEntry('FROGS');
	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.setActiveEntry('FLAME');

	var solution = grid.getIpuzSolution();
	assert.deepEqual(solution, [['F', 'R', 'O', 'G', 'S'],
								['L', '#', 0 , '#', 0],
								['A', 0, 0, 0, 0],
								['M', '#', 0, '#', 0],
								['E', 0, 0, 0, 0]]);

});

QUnit.module('Local storage');

// Helper function to remove all inserted letters and recreate the GridModule
var recreateGrid = function(size, nodeList, assert) {
	var letters = document.getElementsByClassName('letter');
	while (letters[0])
		letters[0].parentNode.removeChild(letters[0]);

	for (var i = 0; i < nodeList.length; i++)
		assert.noLetter(nodeList[i], 'Cleared grid');

	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid recreated');

	return grid;
};

QUnit.test('Remember letter', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');
	
	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.updateLetters('...', '...Z');
	assert.letterEqual(nodeList.gridItem(0, 1), 'Z', 'Set letter');

	grid = recreateGrid(size, nodeList, assert);
	assert.letterEqual(nodeList.gridItem(0, 1), 'Z', 'Remembered letter');
});

QUnit.test('Remember solution', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.showSolution();

	grid = recreateGrid(size, nodeList, assert);
	for (var i = 0; i < size * size; i++) {
		if (nodeList[i].getAttribute('data-x') % 2 == 0 ||
			nodeList[i].getAttribute('data-y') % 2 == 0) {
			assert.letterEqual(nodeList[i], 'A', 'Remembered letter');
		}
	}
});

QUnit.test('Remember clear', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.showSolution();
	grid.clearAll();

	grid = recreateGrid(size, nodeList, assert);
	for (var i = 0; i < size * size; i++) {
		assert.noLetter(nodeList[i], 'Grid empty');
	}
});

QUnit.test('Remember check', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.updateLetters('...', '...ZA');
	grid.checkAnswer();
	assert.noLetter(nodeList.gridItem(0, 1));
	assert.letterEqual(nodeList.gridItem(0, 2), 'A', 'Correct letter');

	grid = recreateGrid(size, nodeList, assert);
	assert.ok(grid, 'Grid recreated');
	assert.noLetter(nodeList.gridItem(0, 1), 'Incorrect letter removed');
	assert.letterEqual(nodeList.gridItem(0, 2), 'A', 'Correct letter preserved');
});

QUnit.test('Remember check all', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 1));
	grid.updateLetters('...', '...ZA');
	grid.checkAll();
	assert.noLetter(nodeList.gridItem(0, 1));
	assert.letterEqual(nodeList.gridItem(0, 2), 'A', 'Correct letter');

	grid = recreateGrid(size, nodeList, assert);
	assert.noLetter(nodeList.gridItem(0, 1), 'Incorrect letter removed');
	assert.letterEqual(nodeList.gridItem(0, 2), 'A', 'Correct letter preserved');
});

QUnit.test('Remember peek', function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	grid.activateClicked(nodeList.gridItem(0, 0));
	grid.showAnswer();
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Correct letter');

	grid = recreateGrid(size, nodeList, assert);
	assert.ok(grid, 'Grid recreated');
	assert.letterEqual(nodeList.gridItem(0, 0), 'A', 'Correct letter preserved');
});

QUnit.test('Migrate storage name', function(assert) {
	var size = 3;
	localStorage.setItem('puzzle1', 'HAM.....');

	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, 'Grid created');

	assert.letterEqual(nodeList.gridItem(0, 0), 'H', 'Correct letter preserved');
	assert.letterEqual(nodeList.gridItem(1, 0), 'A', 'Correct letter preserved');
	assert.letterEqual(nodeList.gridItem(2, 0), 'M', 'Correct letter preserved');

	// Clear storage because other tests get upset when the grid size doesn't match
	localStorage.removeItem('solve-Cyborg-1');
});
