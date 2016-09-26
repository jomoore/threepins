QUnit.module("Grid creator");
QUnit.test("Show select grid", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	GridCreator.showSelectGridInstruction(fixture);
	var instruction = fixture.childNodes[0];
	assert.ok(instruction, "Node is present");
	assert.ok(instruction.classList.contains('instruction'), "Node has instruction class");
	assert.notEqual(instruction.innerHTML.indexOf('CHOOSE YOUR GRID'), -1, "Node has instruction text");
});

QUnit.test("Input field preserved", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var input = document.createElement('input');
	fixture.appendChild(input);
	GridCreator.showSelectGridInstruction(fixture);
	assert.equal(fixture.childNodes[0].tagName.toLowerCase(), 'input', "Input field preserved");
	assert.equal(fixture.childNodes[1].tagName.toLowerCase(), 'p', "Instruction appended");
});

var createAlternatingSvg = function(size) {
	var svgns = "http://www.w3.org/2000/svg";
	var svg = document.createElementNS(svgns, 'svg');
	var squareSize = 10;
	svg.setAttribute('width', size * squareSize);
	svg.setAttribute('height', size * squareSize);

	for (y = 0; y < size; y++) {
		for (x = 0; x < size; x++) {
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

QUnit.test("Create blank grid", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var size = 3;
	var svg = createAlternatingSvg(size);
	assert.equal(svg.getElementsByTagName('rect').length, 9, "SVG created");

	GridCreator.createBlankGrid(svg, fixture);
	var squares = fixture.querySelectorAll('.block, .light');
	assert.equal(squares.length, 9, "Squares created");

	for (var i = 0; i < squares.length; i++) {
		assert.equalCoord(squares[i], {x: i % size, y: Math.floor(i / size)}, "XY co-ordinates correct");

		if (i < size)
			assert.ok(ClassShim.hasClass(squares[i], 'topmost'), "Topmost squares marked");
		else
			assert.notOk(ClassShim.hasClass(squares[i], 'topmost'), "Other squares not marked");

		if (i % size == 0)
			assert.ok(ClassShim.hasClass(squares[i], 'leftmost'), "Leftmost squares marked");
		else
			assert.notOk(ClassShim.hasClass(squares[i], 'leftmost'), "Other squares not marked");

		if (i == 4)
			assert.block(squares[i], "Middle square blocked");
		else
			assert.light(squares[i], "Other squares light");

		if (i == 0 || i == 2 || i == 6)
			assert.numbered(squares[i], "Square numbered");
		else
			assert.notNumbered(squares[i], "Square not numbered");
	}
});

QUnit.test("Show help text", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	GridCreator.showHelpText(fixture);
	assert.ok(fixture.getElementsByTagName('p').length, "Text added");
});

QUnit.module("Suggestions");
var setTestWordList = function(suggestor) {
	var wordList = '$$$$$\r\nracks\r\nracon\r\nradar\r\nradii\r\nradio\r\nRoddy\r\nroded\r\nrodeo\r\nrodes\r\nRodin\r\n';
	suggestor._setWordList(wordList);
};

QUnit.test("Show suggestions", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	suggestor = new GridCreator.Suggestor(fixture, null, null);
	setTestWordList(suggestor);

	suggestor.showSuggestions("R.D.O");
	var suggestions = fixture.getElementsByClassName('suggestion');
	assert.equal(suggestions.length, 3, "Suggestions found");
	assert.notEqual(suggestions[0].textContent.indexOf('CLEAR'), -1, "Clear button found");
	assert.equal(suggestions[1].textContent, 'RADIO', "RADIO suggested");
	assert.equal(suggestions[2].textContent, 'RODEO', "RODEO suggested");
});

QUnit.test("Clear suggestions", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	suggestor = new GridCreator.Suggestor(fixture, null, null);
	setTestWordList(suggestor);

	suggestor.showSuggestions("R.D.O");
	suggestor.clearSuggestions();
	var suggestions = fixture.getElementsByClassName('suggestion');
	assert.equal(suggestions.length, 0, "Suggestions cleared");
});

QUnit.test("No suggestions", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	suggestor = new GridCreator.Suggestor(fixture, null, null);
	setTestWordList(suggestor);

	suggestor.showSuggestions("R.DLO");
	var suggestions = fixture.getElementsByClassName('suggestion');
	assert.equal(suggestions.length, 1, "Clear button only");
	assert.notEqual(suggestions[0].textContent.indexOf('CLEAR'), -1, "Clear button found");
	assert.equal(fixture.getElementsByClassName('warning').length, 1, "Warning found");
});

QUnit.module("Clue creator");
QUnit.test("Create clues", function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var lis;

	ClueCreator.createClues([across, down], {across: [1, 3], down: [1, 2]}, {across: [3, 3], down: [3, 3]}, null);

	lis = across.getElementsByTagName('li');
	assert.equal(lis.length, 2, "Two across clues")
	assert.equal(lis[0].getElementsByClassName('clue-number')[0].textContent, '1 ', "Clue number");
	assert.equal(lis[1].getElementsByClassName('clue-number')[0].textContent, '3 ', "Clue number");
	assert.equal(lis[0].getElementsByClassName('numeration')[0].textContent, ' (3)', "Numeration");
	assert.equal(lis[1].getElementsByClassName('numeration')[0].textContent, ' (3)', "Numeration");

	for (var i = 0; i < lis.length; i++) {
		assert.ok(ClassShim.hasClass(lis[i], 'user-clue'), "Class user-clue");
		assert.ok(ClassShim.hasClass(lis[i], 'select-clue'), "Class select-clue");
		assert.ok(ClassShim.hasClass(lis[i], 'blank-clue'), "Class blank-clue");
	}

	lis = down.getElementsByTagName('li');
	assert.equal(lis.length, 2, "Two down clues")
	assert.equal(lis[0].getElementsByClassName('clue-number')[0].textContent, '1 ', "Clue number");
	assert.equal(lis[1].getElementsByClassName('clue-number')[0].textContent, '2 ', "Clue number");
	assert.equal(lis[0].getElementsByClassName('numeration')[0].textContent, ' (3)', "Numeration");
	assert.equal(lis[1].getElementsByClassName('numeration')[0].textContent, ' (3)', "Numeration");

	for (var i = 0; i < lis.length; i++) {
		assert.ok(ClassShim.hasClass(lis[i], 'user-clue'), "Class user-clue");
		assert.ok(ClassShim.hasClass(lis[i], 'select-clue'), "Class select-clue");
		assert.ok(ClassShim.hasClass(lis[i], 'blank-clue'), "Class blank-clue");
	}
});

QUnit.test("Edit clue", function(assert) {
	var fixture = document.getElementById('qunit-fixture');
	var across = document.createElement('ul');
	var down = document.createElement('ul');
	var lis;
	var clickCount = 0;

	var selectionCallback = function() {
		clickCount++;
	};

	fixture.appendChild(across);
	ClueCreator.createClues([across, down], {across: [1, 3], down: [1, 2]}, {across: [3, 3], down: [3, 3]}, selectionCallback);
	lis = across.getElementsByTagName('li');
	lis[0].click();

	var input = lis[0].getElementsByTagName('input')[0];
	assert.ok(input, "Input field added");
	assert.equal(clickCount, 1, "Listener called");
	assert.ok(ClassShim.hasClass(lis[0], 'user-clue'), "Class user-clue");
	assert.notOk(ClassShim.hasClass(lis[0], 'select-clue'), "No class select-clue");
	assert.notOk(ClassShim.hasClass(lis[0], 'blank-clue'), "No class blank-clue");

	input.value = 'Test clue';
	input.blur();
	assert.equal(lis[0].getElementsByTagName('input').length, 0, "Input field removed");
	assert.equal(lis[0].getElementsByClassName('clue-text')[0].textContent, 'Test clue', "Clue set");
	assert.ok(ClassShim.hasClass(lis[0], 'user-clue'), "Class user-clue");
	assert.ok(ClassShim.hasClass(lis[0], 'select-clue'), "Class select-clue");
	assert.notOk(ClassShim.hasClass(lis[0], 'blank-clue'), "No class blank-clue");
});

QUnit.test("Set numeration", function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');

	ClueCreator.createClues([across, down], {across: [1], down: [1]}, {across: [15], down: [15]}, null);
	var li = across.getElementsByTagName('li')[0];

	ClueCreator.setNumeration([across, down], false, 0, 'YOU MUST BE JOKING');
	assert.equal(li.getElementsByClassName('numeration')[0].textContent, ' (3,4,2,6)', "Numeration with spaces");

	ClueCreator.setNumeration([across, down], false, 0, 'VERTICAL TAKE-OFF');
	assert.equal(li.getElementsByClassName('numeration')[0].textContent, ' (8,4-3)', "Numeration with hyphen");

	ClueCreator.setNumeration([across, down], false, 0, 'UNSOPHISTICATED');
	assert.equal(li.getElementsByClassName('numeration')[0].textContent, ' (15)', "Numeration with single word");
});

QUnit.test("Get ipuz clues", function(assert) {
	var across = document.createElement('ul');
	var down = document.createElement('ul');

	ClueCreator.createClues([across, down], {across: [1, 2], down: [1]}, {across: [3, 4], down: [15]}, null);
	var ipuz = ClueCreator.getIpuzClues(across);

	assert.equal(ipuz.length, 2, "Array returned");
	assert.equal(ipuz[0].number, '1', "Clue number");
	assert.equal(ipuz[0].clue, '', "Clue text");
	assert.equal(ipuz[0].enumeration, '3', "Enumeration");
	assert.equal(ipuz[1].number, '2', "Clue number");
	assert.equal(ipuz[1].clue, '', "Clue text");
	assert.equal(ipuz[1].enumeration, '4', "Enumeration");
});
