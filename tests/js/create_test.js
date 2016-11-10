QUnit.module('Grid creator');
var createAlternatingSvg = function(size) {
	var svgns = 'http://www.w3.org/2000/svg';
	var svg = document.createElementNS(svgns, 'svg');
	var squareSize = 10;
	svg.setAttribute('width', size * squareSize);
	svg.setAttribute('height', size * squareSize);

	for (var y = 0; y < size; y++) {
		for (var x = 0; x < size; x++) {
			var rect = document.createElementNS(svgns, 'rect');
			rect.setAttribute('x', x * squareSize);
			rect.setAttribute('y', y * squareSize);
			rect.setAttribute('width', squareSize);
			rect.setAttribute('height', squareSize);
			rect.setAttribute('style', 'fill:rgb(' +
							  (((x % 2) && (y % 2)) ? '0,0,0' : '255,255,255') +
							   ');stroke-width:1;stroke:rgb(0,0,0)');
			svg.appendChild(rect);
		}
	}

	return svg;
};

var verify_alternating_grid = function(assert, fixture, size) {
	var squares = fixture.querySelectorAll('.block, .light');
	assert.equal(squares.length, 9, 'Squares created');

	for (var i = 0; i < squares.length; i++) {
		assert.equalCoord(squares[i], {x: i % size, y: Math.floor(i / size)}, 'XY co-ordinates correct');

		if (i < size)
			assert.ok(ClassShim.hasClass(squares[i], 'topmost'), 'Topmost squares marked');
		else
			assert.notOk(ClassShim.hasClass(squares[i], 'topmost'), 'Other squares not marked');

		if (i % size == 0)
			assert.ok(ClassShim.hasClass(squares[i], 'leftmost'), 'Leftmost squares marked');
		else
			assert.notOk(ClassShim.hasClass(squares[i], 'leftmost'), 'Other squares not marked');

		if (i == 4) {
			assert.block(squares[i], 'Middle square blocked');
			assert.ok(squares[i].getElementsByTagName('img').length, 'Block image attached');
		} else
			assert.light(squares[i], 'Other squares light');

		if (i == 0 || i == 2 || i == 6)
			assert.numbered(squares[i], 'Square numbered');
		else
			assert.notNumbered(squares[i], 'Square not numbered');
	}
};

QUnit.test('Create blank grid', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var size = 3;
	var svg = createAlternatingSvg(size);
	assert.equal(svg.getElementsByTagName('rect').length, 9, 'SVG created');

	GridCreator.createBlankGrid(svg, fixture, '#');
	verify_alternating_grid(assert, fixture, size);
});

QUnit.test('Create ipuz grid', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var size = 3;
	var ipuz = {
		puzzle: [[1, 0, 2], [0, '#', 0], [3, 0, 0]],
		solution: [['F', 'I', 'G'], [0, '#', 'A'], [0, 0, 'S']],
	};

	GridCreator.createIpuzGrid(fixture, ipuz.puzzle, ipuz.solution, '#');	
	verify_alternating_grid(assert, fixture, size);

	var letters = fixture.getElementsByClassName('letter');
	assert.equal(letters.length, 5, 'Correct number of letters filled in');
	assert.equal(letters[0].textContent, 'F', 'First letter correct');
	assert.equal(letters[4].textContent, 'S', 'Last letter correct');
	assert.equal(letters[4].parentNode.getAttribute('data-x'), 2, 'Last letter correctly placed');
	assert.equal(letters[4].parentNode.getAttribute('data-y'), 2, 'Last letter correctly placed');
});

QUnit.test('Add block', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var size = 3;
	var svg = createAlternatingSvg(size);
	GridCreator.createBlankGrid(svg, fixture, '#');
	
	var nodeList = fixture.querySelectorAll('.block, .light');
	assert.light(nodeList.gridItem(2, 0), 'Light present');
	assert.numbered(nodeList.gridItem(2, 0), 'Light numbered');
	assert.notNumbered(nodeList.gridItem(2, 1), 'Light not numbered');
	
	GridCreator.toggleSquare(fixture, nodeList[2]);
	assert.block(nodeList.gridItem(2, 0), 'Light changed to block');
	assert.notNumbered(nodeList.gridItem(2, 0), 'Number removed');
	assert.numbered(nodeList.gridItem(2, 1), 'Number added to new head square');
});

QUnit.test('Add light', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var size = 3;
	var svg = createAlternatingSvg(size);
	GridCreator.createBlankGrid(svg, fixture, '#');
	
	var nodeList = fixture.querySelectorAll('.block, .light');
	assert.block(nodeList.gridItem(1, 1), 'Block present');
	assert.notNumbered(nodeList.gridItem(1, 0), 'Light not numbered');
	assert.notNumbered(nodeList.gridItem(0, 1), 'Light not numbered');
	
	GridCreator.toggleSquare(fixture, nodeList.gridItem(1, 1));
	assert.light(nodeList.gridItem(1, 1), 'Block changed to light');
	assert.numbered(nodeList.gridItem(1, 0), 'Number added to new head square');
	assert.numbered(nodeList.gridItem(0, 1), 'Number added to new head square');
});

QUnit.module('Suggestions');
var setTestWordList = function() {
	var wordList = '$$$$$\r\nracks\r\nracon\r\nradar\r\nradii\r\nradio\r\nRoddy\r\nroded\r\nrodeo\r\nrodes\r\nRodin\r\n';
	Suggestor._setWordList(wordList);
};

QUnit.test('Show suggestions', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	setTestWordList();

	Suggestor.showSuggestions(fixture, 'R.D.O');
	var suggestions = fixture.getElementsByClassName('suggestion');
	assert.equal(suggestions.length, 3, 'Suggestions found');
	assert.notEqual(suggestions[0].textContent.indexOf('CLEAR'), -1, 'Clear button found');
	assert.equal(suggestions[1].textContent, 'RADIO', 'RADIO suggested');
	assert.equal(suggestions[2].textContent, 'RODEO', 'RODEO suggested');
});

QUnit.test('Clear suggestions', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	setTestWordList();

	Suggestor.showSuggestions(fixture, 'R.D.O');
	Suggestor.clearSuggestions();
	var suggestions = fixture.getElementsByClassName('suggestion');
	assert.equal(suggestions.length, 0, 'Suggestions cleared');
});

QUnit.test('No suggestions', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	setTestWordList();

	Suggestor.showSuggestions(fixture, 'R.DLO');
	var suggestions = fixture.getElementsByClassName('suggestion');
	assert.equal(suggestions.length, 1, 'Clear button only');
	assert.notEqual(suggestions[0].textContent.indexOf('CLEAR'), -1, 'Clear button found');
	assert.equal(fixture.getElementsByClassName('warning').length, 1, 'Warning found');
});

QUnit.module('Clue creator');
QUnit.test('Create clues', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var lis;
	var i;

	ClueCreator.createClues([across, down], {across: [{x: 0, y: 0, clueNum: '1', wordLen: 3}, {x: 0, y: 2, clueNum: '3', wordLen: 3}],
											 down: [{x: 0, y: 0, clueNum: '1', wordLen: 3}, {x: 2, y: 0, clueNum: '2', wordLen: 3}]});
	lis = across.getElementsByTagName('li');
	assert.equal(lis.length, 2, 'Two across clues');
	assert.equal(lis[0].getElementsByClassName('clue-number')[0].textContent, '1 ', 'Clue number');
	assert.equal(lis[1].getElementsByClassName('clue-number')[0].textContent, '3 ', 'Clue number');
	assert.equal(lis[0].getElementsByClassName('numeration')[0].textContent, ' (3)', 'Numeration');
	assert.equal(lis[1].getElementsByClassName('numeration')[0].textContent, ' (3)', 'Numeration');

	for (i = 0; i < lis.length; i++) {
		assert.ok(ClassShim.hasClass(lis[i], 'user-clue'), 'Class user-clue');
		assert.ok(ClassShim.hasClass(lis[i], 'select-clue'), 'Class select-clue');
		assert.ok(ClassShim.hasClass(lis[i], 'blank-clue'), 'Class blank-clue');
	}

	lis = down.getElementsByTagName('li');
	assert.equal(lis.length, 2, 'Two down clues');
	assert.equal(lis[0].getElementsByClassName('clue-number')[0].textContent, '1 ', 'Clue number');
	assert.equal(lis[1].getElementsByClassName('clue-number')[0].textContent, '2 ', 'Clue number');
	assert.equal(lis[0].getElementsByClassName('numeration')[0].textContent, ' (3)', 'Numeration');
	assert.equal(lis[1].getElementsByClassName('numeration')[0].textContent, ' (3)', 'Numeration');

	for (i = 0; i < lis.length; i++) {
		assert.ok(ClassShim.hasClass(lis[i], 'user-clue'), 'Class user-clue');
		assert.ok(ClassShim.hasClass(lis[i], 'select-clue'), 'Class select-clue');
		assert.ok(ClassShim.hasClass(lis[i], 'blank-clue'), 'Class blank-clue');
	}
});

QUnit.test('Edit clue', function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var lis;
	var clickCount = 0;

	var selectionCallback = function() {
		clickCount++;
	};

	fixture.appendChild(across);
	ClueCreator.registerListeners(selectionCallback, null);
	ClueCreator.createClues([across, down], {across: [{x: 0, y: 0, clueNum: '1', wordLen: 3}, {x: 0, y: 2, clueNum: '3', wordLen: 3}],
											 down: [{x: 0, y: 0, clueNum: '1', wordLen: 3}, {x: 2, y: 0, clueNum: '2', wordLen: 3}]});
	lis = across.getElementsByTagName('li');
	lis[0].click();

	var input = lis[0].getElementsByTagName('input')[0];
	assert.ok(input, 'Input field added');
	assert.equal(clickCount, 1, 'Listener called');
	assert.ok(ClassShim.hasClass(lis[0], 'user-clue'), 'Class user-clue');
	assert.notOk(ClassShim.hasClass(lis[0], 'select-clue'), 'No class select-clue');
	assert.notOk(ClassShim.hasClass(lis[0], 'blank-clue'), 'No class blank-clue');

	input.value = 'Test clue';
	input.blur();
	assert.equal(lis[0].getElementsByTagName('input').length, 0, 'Input field removed');
	assert.equal(lis[0].getElementsByClassName('clue-text')[0].textContent, 'Test clue', 'Clue set');
	assert.ok(ClassShim.hasClass(lis[0], 'user-clue'), 'Class user-clue');
	assert.ok(ClassShim.hasClass(lis[0], 'select-clue'), 'Class select-clue');
	assert.notOk(ClassShim.hasClass(lis[0], 'blank-clue'), 'No class blank-clue');
});

QUnit.test('Set numeration', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');

	ClueCreator.createClues([across, down], {across: [{x: 0, y: 0, clueNum: '1', wordLen: 15}],
											 down: [{x: 0, y: 0, clueNum: '1', wordLen: 15}]});
	var li = across.getElementsByTagName('li')[0];

	ClueCreator.setNumeration([across, down], false, 0, 'YOU MUST BE JOKING');
	assert.equal(li.getElementsByClassName('numeration')[0].textContent, ' (3,4,2,6)', 'Numeration with spaces');

	ClueCreator.setNumeration([across, down], false, 0, 'VERTICAL TAKE-OFF');
	assert.equal(li.getElementsByClassName('numeration')[0].textContent, ' (8,4-3)', 'Numeration with hyphen');

	ClueCreator.setNumeration([across, down], false, 0, 'UNSOPHISTICATED');
	assert.equal(li.getElementsByClassName('numeration')[0].textContent, ' (15)', 'Numeration with single word');
});

QUnit.test('Get ipuz clues', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');

	ClueCreator.createClues([across, down], {across: [{x: 0, y: 0, clueNum: '1', wordLen: 3}, {x: 0, y: 2, clueNum: '2', wordLen: 4}],
											 down: [{x: 0, y: 0, clueNum: '1', wordLen: 15}]});
	var ipuz = ClueCreator.getIpuzClues(across);

	assert.equal(ipuz.length, 2, 'Array returned');
	assert.equal(ipuz[0].number, '1', 'Clue number');
	assert.equal(ipuz[0].clue, '', 'Clue text');
	assert.equal(ipuz[0].enumeration, '3', 'Enumeration');
	assert.equal(ipuz[1].number, '2', 'Clue number');
	assert.equal(ipuz[1].clue, '', 'Clue text');
	assert.equal(ipuz[1].enumeration, '4', 'Enumeration');
});

QUnit.test('Set ipuz clues', function(assert) {
	var across = document.createElement('ul');
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5,6'},
					 {number: 2, clue: '', enumeration: '3'}],
			Down: []
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 11}, {x: 0, y: 2, clueNum: '2', wordLen: 3}],
		down: []
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	var lis = across.getElementsByTagName('li');
	assert.equal(lis.length, 2, 'Correct number of list items created');
	assert.equal(lis[0].getElementsByClassName('clue-number')[0].textContent, '1 ', 'First clue number correct');
	assert.equal(lis[0].getElementsByClassName('clue-text')[0].textContent, 'Clue 1', 'First clue text correct');
	assert.equal(lis[0].getElementsByClassName('numeration')[0].textContent, ' (5,6)', 'First numeration correct');
	assert.equal(lis[1].getElementsByClassName('clue-number')[0].textContent, '2 ', 'Second clue number correct');
	assert.equal(lis[1].getElementsByClassName('clue-text').length, 0, 'Second clue has no text');
	assert.equal(lis[1].getElementsByClassName('numeration')[0].textContent, ' (3)', 'Second Numeration correct');
});

var verify_clues = function(assert, ul, expected) {
	var lis = ul.getElementsByTagName('li');
	assert.equal(lis.length, expected.length, 'Number of clues correct');

	for (var i = 0; i < expected.length; i++) {
		assert.equal(lis[i].getElementsByClassName('clue-number')[0].textContent, expected[i].clueNum, 'Clue number correct');
		if (expected[i].clueText.length)
			assert.equal(lis[i].getElementsByClassName('clue-text')[0].textContent, expected[i].clueText, 'Clue text correct');
		else
			assert.equal(lis[i].getElementsByClassName('clue-text').length, 0);
		assert.equal(lis[i].getElementsByClassName('numeration')[0].textContent, expected[i].numeration, 'Numeration correct');
	}
};

QUnit.test('Tail extend entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 3, clue: 'Clue 3', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 2, clue: 'Clue 2', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 0, y: 2, clueNum: '3', wordLen: 5}],
		down: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 2, y: 0, clueNum: '2', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[0].wordLen = 6;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[1].wordLen = 6;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (6)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[0].wordLen = 6;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (6)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[1].wordLen = 6;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (6)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (6)'}]);
});

QUnit.test('Head extend entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 3, clue: 'Clue 3', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 2, clue: 'Clue 2', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 1, y: 0, clueNum: '1', wordLen: 5}, {x: 1, y: 2, clueNum: '3', wordLen: 5}],
		down: [{x: 0, y: 1, clueNum: '1', wordLen: 5}, {x: 2, y: 1, clueNum: '2', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[0].wordLen = 6;
	clueData.across[0].x = 0;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[1].wordLen = 6;
	clueData.across[1].x = 0;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (6)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[0].wordLen = 6;
	clueData.down[0].y = 0;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (6)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[1].wordLen = 6;
	clueData.down[1].y = 0;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (6)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (6)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (6)'}]);
});

QUnit.test('Head shorten entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 3, clue: 'Clue 3', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 2, clue: 'Clue 2', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 0, y: 2, clueNum: '3', wordLen: 5}],
		down: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 2, y: 0, clueNum: '2', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[0].wordLen = 4;
	clueData.across[0].x = 1;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (4)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[1].wordLen = 4;
	clueData.across[1].x = 1;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (4)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (4)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[0].wordLen = 4;
	clueData.down[0].y = 1;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (4)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (4)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (4)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[1].wordLen = 4;
	clueData.down[1].y = 1;
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (4)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (4)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (4)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (4)'}]);
});

QUnit.test('Split entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 3, clue: 'Clue 3', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 2, clue: 'Clue 2', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 0, y: 2, clueNum: '3', wordLen: 5}],
		down: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 2, y: 0, clueNum: '2', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[0].wordLen = 2;
	clueData.across.splice(1, 0, {x: 3, y: 0, clueNum: '3', wordLen: 2});
	clueData.across[2].clueNum = '4';
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (2)'},
								  {clueNum: '3 ', clueText: '', numeration: ' (2)'},
								  {clueNum: '4 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across[2].wordLen = 2;
	clueData.across.splice(3, 0, {x: 3, y: 2, clueNum: '5', wordLen: 2});
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (2)'},
								  {clueNum: '3 ', clueText: '', numeration: ' (2)'},
								  {clueNum: '4 ', clueText: 'Clue 3', numeration: ' (2)'},
								  {clueNum: '5 ', clueText: '', numeration: ' (2)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down[0].wordLen = 2;
	clueData.down.splice(2, 0, {x: 0, y: 3, clueNum: '6', wordLen: 2});
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (2)'},
								  {clueNum: '3 ', clueText: '', numeration: ' (2)'},
								  {clueNum: '4 ', clueText: 'Clue 3', numeration: ' (2)'},
								  {clueNum: '5 ', clueText: '', numeration: ' (2)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (2)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'},
								{clueNum: '6 ', clueText: '', numeration: ' (2)'}]);								  
});

QUnit.test('Join entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 2, clue: 'Clue 2', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 3, clue: 'Clue 3', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 6, y: 0, clueNum: '2', wordLen: 5}],
		down: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 0, y: 6, clueNum: '3', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);

	clueData.across = [{x: 0, y: 0, clueNum: '1', wordLen: 11}];
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (11)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);

	clueData.down = [{x: 0, y: 0, clueNum: '1', wordLen: 11}];
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (11)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (11)'}]);
});

QUnit.test('Add entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 3, clue: 'Clue 3', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 2, clue: 'Clue 2', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 0, y: 2, clueNum: '3', wordLen: 5}],
		down: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 2, y: 0, clueNum: '2', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across.splice(1, 0, {x: 0, y: 1, clueNum: '3', wordLen: 5});
	clueData.across[2].clueNum = '4';
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: '', numeration: ' (5)'},
								  {clueNum: '4 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across.splice(3, 0, {x: 0, y: 3, clueNum: '5', wordLen: 5});
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: '', numeration: ' (5)'},
								  {clueNum: '4 ', clueText: 'Clue 3', numeration: ' (5)'},
								  {clueNum: '5 ', clueText: '', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down.splice(2, 0, {x: 4, y: 0, clueNum: '3', wordLen: 5});
	clueData.across[1].clueNum = '4';
	clueData.across[2].clueNum = '5';
	clueData.across[3].clueNum = '6';
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '4 ', clueText: '', numeration: ' (5)'},
								  {clueNum: '5 ', clueText: 'Clue 3', numeration: ' (5)'},
								  {clueNum: '6 ', clueText: '', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'},
								{clueNum: '3 ', clueText: '', numeration: ' (5)'}]);
});

QUnit.test('Remove entries', function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var clueLists = [across, down];
	var ipuz = {
		clues: {
			Across: [{number: 1, clue: 'Clue 1', enumeration: '5'},
					 {number: 3, clue: 'Clue 3', enumeration: '5'}],
			Down: [{number: 1, clue: 'Clue 1', enumeration: '5'},
				   {number: 2, clue: 'Clue 2', enumeration: '5'}]
		}
	};
	var clueData = {
		across: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 0, y: 2, clueNum: '3', wordLen: 5}],
		down: [{x: 0, y: 0, clueNum: '1', wordLen: 5}, {x: 2, y: 0, clueNum: '2', wordLen: 5}],
	};

	ClueCreator.setIpuzClues(across, clueData.across, ipuz.clues.Across);
	ClueCreator.setIpuzClues(down, clueData.down, ipuz.clues.Down);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								  {clueNum: '3 ', clueText: 'Clue 3', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.across.splice(1, 1);
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'},
								{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);

	clueData.down.splice(0, 1);
	ClueCreator.renumberClues(clueLists, clueData);
	verify_clues(assert, across, [{clueNum: '1 ', clueText: 'Clue 1', numeration: ' (5)'}]);
	verify_clues(assert, down, [{clueNum: '2 ', clueText: 'Clue 2', numeration: ' (5)'}]);
});
