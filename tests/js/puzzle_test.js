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
		localStorage.removeItem('puzzle1');
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
	}

	return {
		fixture: fixture,
		createEmpty: createEmpty,
		createAlternating: createAlternating,
		blockRow: blockRow,
		blockCol: blockCol,
		reset: reset
	}
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

QUnit.module("Builder functions");
QUnit.test("Map node list to co-ordinates", function(assert) {
	for (var size = 3; size <= 15; size++)
	{
		var nodeList = Builder.createEmpty(size);

		assert.equal(nodeList.length, size * size, "Create empty grid size " + size);
		assert.equalCoord(nodeList[0], {x: 0, y: 0}, "First cell");
		assert.equalCoord(nodeList[1], {x: 1, y: 0}, "Second cell");
		assert.equalCoord(nodeList[size], {x: 0, y: 1}, "Second row");
		assert.equalCoord(nodeList[2 * size + 1], {x: 1, y: 2}, "Third row");
		assert.equalCoord(nodeList[nodeList.length - 1], {x: size - 1, y: size - 1}, "Last cell");

		Builder.reset();
	}
});

QUnit.test("Build even grid", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, "Create even grid size " + size);
	assert.light(nodeList[0], "Row 0, Col 0");
	assert.light(nodeList[1], "Row 0, Col 1");
	assert.light(nodeList[size], "Row 1, Col 0");
	assert.block(nodeList[size + 1], "Row 1, Col 1");
	assert.light(nodeList[size + 2], "Row 1, Col 2");
	assert.block(nodeList[size + 3], "Row 1, Col 3");
	assert.light(nodeList[size + 4], "Row 1, Col 4");
	assert.light(nodeList[nodeList.length - 2], "Row 4, Col 3");
	assert.light(nodeList[nodeList.length - 1], "Row 4, Col 4");

	/* Check clue numbers */
	for (var i = 0; i < size; i++) {
		if (i % 2 == 0)
			assert.numbered(nodeList[i], "Down entry numbered");
		else
			assert.notNumbered(nodeList[i], "No number");
	}

	for (var i = 0; i < size * size; i += size) {
		if (i % 2 == 0)
			assert.numbered(nodeList[i], "Across entry numbered");
		else
			assert.notNumbered(nodeList[i], "No number");
	}
});

QUnit.test("Build odd grid", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, "Create odd grid size " + size);
	assert.block(nodeList[0], "Row 0, Col 0");
	assert.light(nodeList[1], "Row 0, Col 1");
	assert.block(nodeList[2], "Row 0, Col 2");
	assert.light(nodeList[3], "Row 0, Col 3");
	assert.block(nodeList[4], "Row 0, Col 4");
	assert.light(nodeList[size], "Row 1, Col 0");
	assert.light(nodeList[size + 1], "Row 1, Col 1");
	assert.light(nodeList[nodeList.length - 2], "Row 4, Col 3");
	assert.block(nodeList[nodeList.length - 1], "Row 4, Col 4");

	/* Check clue numbers */
	for (var i = 0; i < size; i++) {
		if (i % 2 == 1)
			assert.numbered(nodeList[i], "Down entry numbered");
		else
			assert.notNumbered(nodeList[i], "No number");
	}

	for (var i = 0; i < size * size; i += size) {
		if (i % 2 == 1)
			assert.numbered(nodeList[i], "Across entry numbered");
		else
			assert.notNumbered(nodeList[i], "No number");
	}
});

QUnit.test("Build bordered even grid", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	Builder.blockRow(0, size, nodeList);
	Builder.blockRow(size - 1, size, nodeList);
	Builder.blockCol(0, size, nodeList);
	Builder.blockCol(size - 1, size, nodeList);

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, "Create bordered even grid size " + size);
	assert.block(nodeList[0], "Row 0, Col 0");
	assert.block(nodeList[1], "Row 0, Col 1");
	assert.block(nodeList[4], "Row 0, Col 4");
	assert.block(nodeList[size], "Row 1, Col 0");
	assert.block(nodeList[size + 1], "Row 1, Col 1");
	assert.light(nodeList[size + 2], "Row 1, Col 2");
	assert.block(nodeList[size + 3], "Row 1, Col 3");
	assert.block(nodeList[size + 4], "Row 1, Col 4");
	assert.block(nodeList[2 * size], "Row 2, Col 0");
	assert.light(nodeList[2 * size + 1], "Row 2, Col 1");
	assert.light(nodeList[2 * size + 2], "Row 2, Col 2");
	assert.light(nodeList[2 * size + 3], "Row 2, Col 3");
	assert.block(nodeList[2 * size + 4], "Row 2, Col 4");
	assert.block(nodeList[nodeList.length - 2], "Row 4, Col 3");
	assert.block(nodeList[nodeList.length - 1], "Row 4, Col 4");

	/* Check clue numbers */
	assert.numbered(nodeList[size + 2], "Down entry numbered");
	assert.numbered(nodeList[2 * size + 1], "Across entry numbered");
});

QUnit.test("Build bordered odd grid", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	Builder.blockRow(0, size, nodeList);
	Builder.blockRow(size - 1, size, nodeList);
	Builder.blockCol(0, size, nodeList);
	Builder.blockCol(size - 1, size, nodeList);

	/* Check block/light pattern */
	assert.equal(nodeList.length, size * size, "Create bordered odd grid size " + size);
	assert.block(nodeList[0], "Row 0, Col 0");
	assert.block(nodeList[1], "Row 0, Col 1");
	assert.block(nodeList[4], "Row 0, Col 4");
	assert.block(nodeList[size], "Row 1, Col 0");
	assert.light(nodeList[size + 1], "Row 1, Col 1");
	assert.light(nodeList[size + 2], "Row 1, Col 2");
	assert.light(nodeList[size + 3], "Row 1, Col 3");
	assert.block(nodeList[size + 4], "Row 1, Col 4");
	assert.block(nodeList[2 * size], "Row 2, Col 0");
	assert.light(nodeList[2 * size + 1], "Row 2, Col 1");
	assert.block(nodeList[2 * size + 2], "Row 2, Col 2");
	assert.light(nodeList[2 * size + 3], "Row 2, Col 3");
	assert.block(nodeList[2 * size + 4], "Row 2, Col 4");
	assert.block(nodeList[nodeList.length - 2], "Row 4, Col 3");
	assert.block(nodeList[nodeList.length - 1], "Row 4, Col 4");

	/* Check clue numbers */
	assert.numbered(nodeList[size + 1], "Down entry numbered");
	assert.numbered(nodeList[size + 3], "Down entry numbered");
	assert.numbered(nodeList[3 * size + 1], "Across entry numbered");
});

QUnit.module("Grid selection");

// Helper to create a grid and load its content from the page
var createGrid = function(size, fixture) {
	var grid = new GridModule.Grid(size);
	grid.loadGrid(fixture);
	grid.loadLetters();
	return grid;
};

QUnit.test("Move target to across entry", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var col = 0; col < 2; col++) {
		for (var target = col; target < size * size; target += 2 * size) {
			grid.activateClicked(nodeList[target]);
			for (var n = 0; n < nodeList.length; n++) {
				if (n == target)
					assert.target(nodeList[target], "Target " + target);
				else if ((n - n % size) / size == (target - col) / size)
					assert.highlighted(nodeList[n], "Highlight - Row " + ((target - col) / size));
				else
					assert.notHighlighted(nodeList[n], "No highlight");
			}
		}
	}
});

QUnit.test("Move target to down entry", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var row = 0; row < 2; row++) {
		for (var target = row * size; target < 2 * row * size; target += 2) {
			grid.activateClicked(nodeList[target]);
			if (target != 0) { // Selects the across entry in preference
				for (var n = 0; n < nodeList.length; n++) {
					if (n == target)
						assert.target(nodeList[target], "Target " + target);
					else if (n % size == target % size)
						assert.highlighted(nodeList[n], "Highlight - Col " + (target % size));
					else
						assert.notHighlighted(nodeList[n], "No highlight");
				}
			}
		}
	}
});


QUnit.test("Move target within across entry", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var target = 0; target < size; target++) {
		// Avoid clicking numbered squares which will select down entries
		if (nodeList[target].querySelector('.grid-number') == null || target == 0)
		{
			grid.activateClicked(nodeList[target]);
			for (var n = 0; n < nodeList.length; n++) {
				if (n == target)
					assert.target(nodeList[target], "Target " + target);
				else if (n < size)
					assert.highlighted(nodeList[n], "Highlight - Row 0");
				else
					assert.notHighlighted(nodeList[n], "No highlight");
			}
		}
	}
});

QUnit.test("Move target within down entry", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var target = 0; target < size * size; target += size) {
		// Avoid clicking numbered squares which will select across entries
		if (nodeList[target].querySelector('.grid-number') == null)
		{
			grid.activateClicked(nodeList[target]);

			for (var n = 0; n < nodeList.length; n++) {
				if (n == target)
					assert.target(nodeList[target], "Target " + target);
				else if (n % size == 0)
					assert.highlighted(nodeList[n], "Highlight - Col 0");
				else
					assert.notHighlighted(nodeList[n], "No highlight");
			}
		}
	}
});

QUnit.test("Toggle across/down @ (0, 0)", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var i = 0; i < 2; i++) {
		/* Select first cell - across entry should be highlighted */
		grid.activateClicked(nodeList[0]);
		assert.target(nodeList[0], "Target - Row 0, Col 0");
		for (var n = 1; n < nodeList.length; n++) {
			if (n < size)
				assert.highlighted(nodeList[n], "Highlight - Row 0, Col " + n);
			else
				assert.notHighlighted(nodeList[n], "No highlight");
		}

		/* Select again - down entry should be highlighted */
		grid.activateClicked(nodeList[0]);
		assert.target(nodeList[0], "Target - Row 0, Col 0)");
		for (var n = 1; n < nodeList.length; n++) {
			if (n % size == 0)
				assert.highlighted(nodeList[n], "Highlight - Row " + (n / size) + ", Col 0");
			else
				assert.notHighlighted(nodeList[n], "No highlight");
		}
	}
});

QUnit.test("Toggle across/down @ (0, 2)", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var i = 0; i < 2; i++) {
		grid.activateClicked(nodeList[2 * size]);
		for (var n = 0; n < nodeList.length; n++) {
			if (n == 2 * size)
				assert.target(nodeList[n], "Target - Row 2, Col 0)");
			else if (n > 2 * size & n < 3 * size)
				assert.highlighted(nodeList[n], "Highlight - Row 2, Col " + (n % size));
			else
				assert.notHighlighted(nodeList[n], "No highlight");
		}

		grid.activateClicked(nodeList[2 * size]);
		for (var n = 0; n < nodeList.length; n++) {
			if (n == 2 * size)
				assert.target(nodeList[n], "Target - Row 2, Col 0)");
			else if (n % size == 0)
				assert.highlighted(nodeList[n], "Highlight - Row " + (n / size) + ", Col 0");
			else
				assert.notHighlighted(nodeList[n], "No highlight");
		}
	}
});

QUnit.test("Toggle across/down @ (2, 2)", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	for (var i = 0; i < 2; i++) {
		grid.activateClicked(nodeList[2 * size + 2]);
		for (var n = 0; n < nodeList.length; n++) {
			if (n == 2 * size + 2)
				assert.target(nodeList[n], "Target - Row 2, Col 2)");
			else if (n >= 2 * size & n < 3 * size)
				assert.highlighted(nodeList[n], "Highlight - Row 2, Col " + (n % size));
			else
				assert.notHighlighted(nodeList[n], "No highlight");
		}

		grid.activateClicked(nodeList[2 * size + 2]);
		for (var n = 0; n < nodeList.length; n++) {
			if (n == 2 * size + 2)
				assert.target(nodeList[n], "Target - Row 2, Col 2)");
			else if (n % size == 2)
				assert.highlighted(nodeList[n], "Highlight - Row " + ((n - n % size) / size) + ", Col 2");
			else
				assert.notHighlighted(nodeList[n], "No highlight");
		}
	}
});

QUnit.test("Select next", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[size]);
	assert.target(nodeList[size], "First across entry");

	grid.activateNext();
	assert.target(nodeList[3 * size], "Second across entry");

	grid.activateNext();
	assert.target(nodeList[1], "First down entry");

	grid.activateNext();
	assert.target(nodeList[3], "Second down entry");

	grid.activateNext();
	assert.target(nodeList[size], "First across entry");
});

QUnit.test("Select previous", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[size]);
	assert.target(nodeList[size], "First across entry");

	grid.activatePrevious();
	assert.target(nodeList[3], "Second down entry");

	grid.activatePrevious();
	assert.target(nodeList[1], "First down entry");

	grid.activatePrevious();
	assert.target(nodeList[3 * size], "Second across entry");

	grid.activatePrevious();
	assert.target(nodeList[size], "First across entry");
});

QUnit.test("Move target within grid limits", function(assert) {
	var size = 3;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	assert.target(nodeList[0], "Initial selection");

	grid.moveTarget(-1, 0);
	assert.target(nodeList[0], "No change");
	grid.moveTarget(0, -1);
	assert.target(nodeList[0], "No change");
	grid.moveTarget(1, 0);
	assert.target(nodeList[1], "Step right");
	grid.moveTarget(0, -1);
	assert.target(nodeList[1], "No change");
	grid.moveTarget(0, 1);
	assert.target(nodeList[1], "No change");
	grid.moveTarget(1, 0);
	assert.target(nodeList[2], "Step right");
	grid.moveTarget(0, -1);
	assert.target(nodeList[2], "No change");
	grid.moveTarget(0, 1);
	assert.target(nodeList[size + 2], "Step down");
	grid.moveTarget(-1, 0);
	assert.target(nodeList[size + 2], "No change");
	grid.moveTarget(1, 0);
	assert.target(nodeList[size + 2], "No change");
	grid.moveTarget(0, 1);
	assert.target(nodeList[2 * size + 2], "Step down");
	grid.moveTarget(0, 1);
	assert.target(nodeList[2 * size + 2], "No change");
	grid.moveTarget(-1, 0);
	assert.target(nodeList[2 * size + 1], "Step left");
	grid.moveTarget(-1, 0);
	assert.target(nodeList[2 * size], "Step left");
	grid.moveTarget(0, -1);
	assert.target(nodeList[size], "Step up");
	grid.moveTarget(0, -1);
	assert.target(nodeList[0], "Step up");
});

QUnit.test("Move target within blocks", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 0);
	Builder.blockRow(0, size, nodeList);
	Builder.blockRow(size - 1, size, nodeList);
	Builder.blockCol(0, size, nodeList);
	Builder.blockCol(size - 1, size, nodeList);

	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[size + 1]);
	assert.target(nodeList[size + 1], "Initial selection");

	grid.moveTarget(-1, 0);
	assert.target(nodeList[size + 1], "No change");
	grid.moveTarget(0, -1);
	assert.target(nodeList[size + 1], "No change");
	grid.moveTarget(1, 0);
	assert.target(nodeList[size + 2], "Step right");
	grid.moveTarget(0, -1);
	assert.target(nodeList[size + 2], "No change");
	grid.moveTarget(0, 1);
	assert.target(nodeList[size + 2], "No change");
	grid.moveTarget(1, 0);
	assert.target(nodeList[size + 3], "Step right");
	grid.moveTarget(0, -1);
	assert.target(nodeList[size + 3], "No change");
	grid.moveTarget(0, 1);
	assert.target(nodeList[2 * size + 3], "Step down");
	grid.moveTarget(-1, 0);
	assert.target(nodeList[2 * size + 3], "No change");
	grid.moveTarget(1, 0);
	assert.target(nodeList[2 * size + 3], "No change");
	grid.moveTarget(0, 1);
	assert.target(nodeList[3 * size + 3], "Step down");
	grid.moveTarget(0, 1);
	assert.target(nodeList[3 * size + 3], "No change");
	grid.moveTarget(-1, 0);
	assert.target(nodeList[3 * size + 2], "Step left");
	grid.moveTarget(-1, 0);
	assert.target(nodeList[3 * size + 1], "Step left");
	grid.moveTarget(0, -1);
	assert.target(nodeList[2 * size + 1], "Step up");
	grid.moveTarget(0, -1);
	assert.target(nodeList[size + 1], "Step up");
});

QUnit.module("Text entry");
QUnit.test("Add text", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	assert.target(nodeList[0], "Initial selection");

	grid.updateLetters('...', '...a');
	grid.updateLetters('...a', '...ab');
	grid.updateLetters('...ab', '...abcd');
	grid.updateLetters('...abcd', '...abcd');
	grid.updateLetters('...abcd', '...abcde');
	grid.updateLetters('...abcde', '...abcdef');

	assert.letterEqual(nodeList[0], 'A', "Content A");
	assert.letterEqual(nodeList[1], 'B', "Content B");
	assert.letterEqual(nodeList[2], 'C', "Content C");
	assert.letterEqual(nodeList[3], 'D', "Content D");
	assert.letterEqual(nodeList[4], 'F', "Content F");
});

QUnit.test("Delete text", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	/* Set up some text to delete */
	grid.activateClicked(nodeList[0]);
	assert.target(nodeList[0], "Initial selection");
	grid.updateLetters('...', '...abcde');
	assert.letterEqual(nodeList[0], 'A', "Content A");
	assert.letterEqual(nodeList[1], 'B', "Content B");
	assert.letterEqual(nodeList[2], 'C', "Content C");

	/* Deleted upwards starting from an empty square */
	grid.activateClicked(nodeList[size]);
	grid.updateLetters('...', '..');
	assert.target(nodeList[0], "Backspace from empty square");
	assert.letterEqual(nodeList[0], 'A', "First square has letter");
	grid.updateLetters('..', '.');
	assert.target(nodeList[0], "Backspace from first square");
	assert.noLetter(nodeList[0], "First letter deleted");
	grid.updateLetters('.', '');
	assert.target(nodeList[0], "No change");

	/* Deleted leftwards starting from a populated square */
	grid.activateClicked(nodeList[2]);
	grid.activateClicked(nodeList[2]);
	grid.updateLetters('...', '..');
	assert.target(nodeList[1], "Backspace from populated square");
	assert.noLetter(nodeList[2], "Backspace from populated square");
	grid.updateLetters('..', '.');
	assert.target(nodeList[0], "Second backspace from populated square");
	assert.noLetter(nodeList[1], "Second backspace from populated square");
});

QUnit.test("Check answer", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	grid.updateLetters('', 'aabba');
	grid.checkAnswer();
	
	assert.letterEqual(nodeList[0], 'A', "Correct letter");
	assert.letterEqual(nodeList[1], 'A', "Correct letter");
	assert.noLetter(nodeList[2], "Incorrect letter");
	assert.noLetter(nodeList[3], "Incorrect letter");
	assert.letterEqual(nodeList[4], 'A', "Correct letter");
});

QUnit.test("Check all", function (assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	grid.updateLetters('', 'aabba');
	grid.activateClicked(nodeList[2 * size]);
	grid.updateLetters('', 'aabba');
	grid.checkAll();

	assert.letterEqual(nodeList[0], 'A', "Correct letter");
	assert.letterEqual(nodeList[1], 'A', "Correct letter");
	assert.noLetter(nodeList[2], "Incorrect letter");
	assert.noLetter(nodeList[3], "Incorrect letter");
	assert.letterEqual(nodeList[4], 'A', "Correct letter");

	assert.letterEqual(nodeList[2 * size], 'A', "Correct letter");
	assert.letterEqual(nodeList[2 * size + 1], 'A', "Correct letter");
	assert.noLetter(nodeList[2 * size + 2], "Incorrect letter");
	assert.noLetter(nodeList[2 * size + 3], "Incorrect letter");
	assert.letterEqual(nodeList[2 * size + 4], 'A', "Correct letter");
});

QUnit.test("Show answer", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	grid.showAnswer();

	for (var i = 0; i < size; i++) {
		assert.letterEqual(nodeList[i], 'A', "Revealed letter");
	}

	for (var i = 2 * size; i < 3 * size; i++) {
		assert.noLetter(nodeList[i], "No revealed letter");
	}
});

QUnit.test("Show solution", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.showSolution();

	for (var i = 0; i < size * size; i++) {
		if (nodeList[i].getAttribute('data-x') % 2 == 0 ||
			nodeList[i].getAttribute('data-y') % 2 == 0) {
			assert.letterEqual(nodeList[i], 'A', "Revealed letter");
		} else {
			assert.block(nodeList[i], "Block");
		}
	}
});

QUnit.test("Clear all", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	assert.target(nodeList[0], "Initial selection");
	grid.updateLetters('...', '...abcde');
	grid.clearAll();

	for (var i = 0; i < size * size; i++) {
		assert.noLetter(nodeList[i], "Grid empty");
	}
});

QUnit.module("Grid-fill");
QUnit.test("Get grid numbers", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	var clueNums = grid.getClueNums();
	assert.deepEqual(clueNums.across, ['1', '4', '5'], "Across clue numbers match");
	assert.deepEqual(clueNums.down, ['1', '2', '3'], "Down clue numbers match");
});

QUnit.test("Get word lengths", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	var wordLengths = grid.getWordLengths();
	assert.deepEqual(wordLengths.across, [5, 5, 5], "Across lengths match");
	assert.deepEqual(wordLengths.down, [5, 5, 5], "Down lengths match");
});

QUnit.test("Get text", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");
	
	grid.activateClicked(nodeList[0]);
	grid.updateLetters('...', '...HI');
	grid.activateClicked(nodeList[3]);
	grid.updateLetters('...', '...MA');

	var entry = grid.getActiveEntry();
	assert.equal(entry, 'HI.MA', "Got active text");
});

QUnit.test("Get index", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");
	
	grid.activateClicked(nodeList[0]);
	assert.equal(grid.getActiveIndex(), 0, "First across");
	assert.equal(grid.getActiveDirection(), false, "Correct direction");
	grid.activateClicked(nodeList[2 * size]);
	assert.equal(grid.getActiveIndex(), 1, "Second across");
	assert.equal(grid.getActiveDirection(), false, "Correct direction");
	grid.activateClicked(nodeList[size]);
	assert.equal(grid.getActiveIndex(), 0, "First down");
	assert.equal(grid.getActiveDirection(), true, "Correct direction");
	grid.activateClicked(nodeList[size - 1]);
	assert.equal(grid.getActiveIndex(), 2, "Third down");
	assert.equal(grid.getActiveDirection(), true, "Correct direction");
});

QUnit.test("Set text", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");
	
	grid.activateClicked(nodeList[1]);
	grid.setActiveEntry('FROGS');
	assert.letterEqual(nodeList[0], 'F', "First letter set");
	assert.letterEqual(nodeList[4], 'S', "Last letter set");
});

QUnit.test("Reset text", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");
	
	grid.activateClicked(nodeList[0]);
	grid.setActiveEntry('FROGS');
	grid.activateClicked(nodeList[size]);
	grid.setActiveEntry('FLAME');
	grid.activateClicked(nodeList[1]);
	grid.resetActiveEntry();

	assert.letterEqual(nodeList[0], 'F', "Checked letter preserved");
	assert.noLetter(nodeList[1], "Unchecked letter removed");
	assert.noLetter(nodeList[size - 1], "Unchecked letter removed");

	grid.activateClicked(nodeList[size * 2 + 1]);
	grid.setActiveEntry('APPLE');
	grid.activateClicked(nodeList[size]);
	grid.resetActiveEntry();

	assert.noLetter(nodeList[0], "Unchecked letter removed");
	assert.letterEqual(nodeList[size * 2], 'A', "Checked letter preserved");
	assert.noLetter(nodeList[size * (size - 1)], "Unchecked letter removed");
});

QUnit.module("Local storage");

// Helper function to remove all inserted letters and recreate the GridModule
var recreateGrid = function(size, nodeList, assert) {
	var letters = document.getElementsByClassName('letter');
	while (letters[0])
		letters[0].parentNode.removeChild(letters[0]);

	for (var i = 0; i < nodeList.length; i++)
		assert.noLetter(nodeList[i], "Cleared grid");

	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid recreated");

	return grid;
};

QUnit.test("Remember letter", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");
	
	grid.activateClicked(nodeList[size]);
	grid.updateLetters('...', '...Z');
	assert.letterEqual(nodeList[size], 'Z', "Set letter");

	grid = recreateGrid(size, nodeList, assert);
	assert.letterEqual(nodeList[size], 'Z', "Remembered letter");
});

QUnit.test("Remember solution", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.showSolution();

	grid = recreateGrid(size, nodeList, assert);
	for (var i = 0; i < size * size; i++) {
		if (nodeList[i].getAttribute('data-x') % 2 == 0 ||
			nodeList[i].getAttribute('data-y') % 2 == 0) {
			assert.letterEqual(nodeList[i], 'A', "Remembered letter");
		}
	}
});

QUnit.test("Remember clear", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.showSolution();
	grid.clearAll();

	grid = recreateGrid(size, nodeList, assert);
	for (var i = 0; i < size * size; i++) {
		assert.noLetter(nodeList[i], "Grid empty");
	}
});

QUnit.test("Remember check", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[size]);
	grid.updateLetters('...', '...ZA');
	grid.checkAnswer();
	assert.noLetter(nodeList[size]);
	assert.letterEqual(nodeList[2 * size], 'A', "Correct letter");

	grid = recreateGrid(size, nodeList, assert);
	assert.ok(grid, "Grid recreated");
	assert.noLetter(nodeList[size], "Incorrect letter removed");
	assert.letterEqual(nodeList[2 * size], 'A', "Correct letter preserved");
});

QUnit.test("Remember check all", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[size]);
	grid.updateLetters('...', '...ZA');
	grid.checkAll();
	assert.noLetter(nodeList[size]);
	assert.letterEqual(nodeList[2 * size], 'A', "Correct letter");

	grid = recreateGrid(size, nodeList, assert);
	assert.noLetter(nodeList[size], "Incorrect letter removed");
	assert.letterEqual(nodeList[2 * size], 'A', "Correct letter preserved");
});

QUnit.test("Remember peek", function(assert) {
	var size = 5;
	var nodeList = Builder.createAlternating(size, 1);
	var grid = createGrid(size, Builder.fixture);
	assert.ok(grid, "Grid created");

	grid.activateClicked(nodeList[0]);
	grid.showAnswer();
	assert.letterEqual(nodeList[0], 'A', "Correct letter");

	grid = recreateGrid(size, nodeList, assert);
	assert.ok(grid, "Grid recreated");
	assert.letterEqual(nodeList[0], 'A', "Correct letter preserved");
});
