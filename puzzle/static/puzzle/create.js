/*
 * @licstart  The following is the entire license notice for the JavaScript code in this page.
 *
 * MIT License
 * Copyright (c) 2016 Jeremy Moore
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @licend  The above is the entire license notice for the JavaScript code in this page.
 */

var GridCreator = (function() {
	var createSquare = function(x, y, isBlock, blockImgUrl, number, letter) {
		var sq = document.createElement('div');
		sq.setAttribute('data-x', x);
		sq.setAttribute('data-y', y);
		if (x == 0)
			ClassShim.addClass(sq, 'leftmost');
		if (y == 0)
			ClassShim.addClass(sq, 'topmost');

		if (isBlock) {
			ClassShim.addClass(sq, 'block');
			if (blockImgUrl) {
				// Add image for print
				var img = document.createElement('img');
				img.src = blockImgUrl;
				img.alt = 'block';
				sq.appendChild(img);
			}
		} else {
			ClassShim.addClass(sq, 'light');
			if (number) {
				var gn = document.createElement('div');
				gn.innerHTML = number;
				ClassShim.addClass(gn, 'grid-number');
				sq.appendChild(gn);
			}

			if (letter) {
				var el = document.createElement('span');
				ClassShim.addClass(el, 'letter');
				el.innerHTML = letter.toUpperCase();
				sq.appendChild(el);
			}
		}

		return sq;
	};

	return {
		createBlankGrid: function(svg, container, blockImgUrl) {
			var gridNumber = 1;
			var rects = svg.getElementsByTagName('rect');
			var size = Math.sqrt(rects.length);
			var i;

			var isBlock = [];
			for (i = 0; i < rects.length; i++) {
				var color = rects[i].style.fill.replace(/ /g, '');
				isBlock.push(color === 'rgb(0,0,0)' || color === '#000000' || color === 'black');
			}

			for (i = 0; i < rects.length; i++) {
				var x = rects[i].x.baseVal.value / rects[i].width.baseVal.value;
				var y = rects[i].y.baseVal.value / rects[i].height.baseVal.value;
				var number = undefined;

				if (!isBlock[i]) {
					// Add clue number
					var headAcross = ((x < size - 1) && !isBlock[i + 1] && (x == 0 || isBlock[i - 1]));
					var headDown = ((y < size - 1) && !isBlock[i + size] && (y == 0 || isBlock[i - size]));
					if (headAcross || headDown)
						number = gridNumber++;
				}

				container.appendChild(createSquare(x, y, isBlock[i], blockImgUrl, number));
			}
		},

		createIpuzGrid: function(container, puzzle, solution, blockImgUrl) {
			for (var row = 0; row < puzzle.length; row++) {
				for (var col = 0; col < puzzle[row].length; col++) {
					var isBlock = (puzzle[row][col] === '#');
					var number = isBlock ? 0 : puzzle[row][col];
					var letter = solution[row][col];

					container.appendChild(createSquare(col, row, isBlock, blockImgUrl, number, letter));
				}
			}
		},

		connectControls: function(container, grid, ip, antiqueIE) {
			grid.loadGrid(container);

			var input = new GridModule.GridInput(grid);
			input.registerControl(ip, antiqueIE);

			var squares = container.querySelectorAll('.block, .light');
			for (var i = 0; i < squares.length; i++) {
				squares[i].addEventListener('mousedown', function(e) {
					if (grid.activateClicked(this))
						input.reset();
					e.preventDefault();
					return false;
				});
			}
		},
	};
})();


var Suggestor = (function() {
	var box;
	var wordList = null;
	var re;
	var pattern;
	var requestId = 0;

	var appendClearButton = function(clearHandler) {
		var clearButton = document.createElement('span');
		clearButton.textContent = '--CLEAR--';
		ClassShim.addClass(clearButton, 'suggestion');
		clearButton.addEventListener('click', function() {
			clearHandler();
		});
		box.appendChild(clearButton);
	};
	
	var appendPadding = function() {
		var padding = document.createElement('span');
		padding.innerHTML = '&nbsp;';
		ClassShim.addClass(padding, 'padding');
		box.appendChild(padding);
	};

	var appendSuggestions = function(maxNum, req, clickHandler) {
		var result;
		var count = 0;

		if (req != requestId)
			return 0;
		
		while (count < maxNum && (result = re.exec(wordList[pattern.length])) !== null) {
			var suggestion = document.createElement('span');
			var spacer = document.createTextNode(' ');

			ClassShim.addClass(suggestion, 'suggestion');
			suggestion.innerHTML = result[0].toUpperCase().trim();
			suggestion.addEventListener('click', function() {
				clickHandler(this.innerHTML);
			});

			box.appendChild(suggestion);
			box.appendChild(spacer);
			++count;
		}

		if (count < maxNum)
			appendPadding();
		else
			window.setTimeout(appendSuggestions, 100, maxNum, req, clickHandler);

		return count;
	};

	return {
		clearSuggestions: function() {
			++requestId;
			box.innerHTML = '';
		},

		showSuggestions: function(suggestionBox, searchPattern, clickHandler, clearHandler) {
			++requestId;
			box = suggestionBox;
			box.innerHTML = '';
			pattern = searchPattern;
			var max = 200;

			if (wordList && pattern.search('[^\\.]') != -1) {
				appendClearButton(clearHandler);

				re = new RegExp('^' + pattern.replace(/./g, '$&\\W?') + '$', 'gim');
				var count = appendSuggestions(max, requestId, clickHandler);

				if (count == 0) {
					var warning = document.createElement('span');
					ClassShim.addClass(warning, 'warning');
					warning.innerHTML = 'SORRY, NOTHING FITS HERE<br>';
					box.insertBefore(warning, box.firstChild);
				}

				return true;
			}
			
			return false;
		},

		loadWordList: function(url) {
			var xhttp = new XMLHttpRequest();
			xhttp.onload = function() {
				wordList = xhttp.responseText.split('$');
			};
			xhttp.open('GET', url);
			xhttp.send();
		},

		// Test hook
		_setWordList: function(w) {
			wordList = w.split('$');
		},
	};
})();


var ClueCreator = (function() {
	var selectionCallback;
	var changeCallback;

	var ClueInput = function() {
		var li;

		this.getListItem = function() {
			return li;
		};

		var freezeClue = function(e) {
			var input = e.target;
			if (input.value) {
				var text = document.createElement('span');
				ClassShim.addClass(text, 'clue-text');
				text.textContent = input.value;
				li.insertBefore(text, input);
			} else
				ClassShim.addClass(li, 'blank-clue');

			li.removeChild(input);
			ClassShim.addClass(li, 'select-clue');
			li.addEventListener('click', editClue);

			if (changeCallback)
				changeCallback();
		};

		var editClue = function() {
			if (selectionCallback)
				selectionCallback();
			
			ClassShim.removeClass(li, 'select-clue');
			ClassShim.removeClass(li, 'blank-clue');
			li.removeEventListener('click', editClue);

			var input = document.createElement('input');
			var clueText = li.getElementsByClassName('clue-text')[0];
			if (clueText) {
				input.value = clueText.textContent;
				li.removeChild(clueText);
			}

			var inputWidth = li.clientWidth;
			for (var i = 0; i < li.childNodes.length; i++)
				inputWidth -= li.childNodes[i].offsetWidth;
			input.style.width = (inputWidth - 8) + 'px';

			li.insertBefore(input, li.lastChild);
			input.addEventListener('blur', freezeClue);
			input.addEventListener('keydown', function(e) {
				switch (e.which) {
				case 13:
				case 27:
					input.blur();
				}
			});
			input.focus();
		};

		var initClue = function(clueNum, clueText, wordLength) {
			li = document.createElement('li');
			var content = '<span class="clue-number">' + clueNum + ' </span>';

			if (clueText.length)
				content += '<span class="clue-text">' + clueText + '</span>';
			else
				ClassShim.addClass(li, 'blank-clue');

			content += '<span class="numeration"> (' + wordLength + ')</span>';
			
			ClassShim.addClass(li, 'user-clue');
			ClassShim.addClass(li, 'select-clue');
			li.innerHTML = content;
			li.addEventListener('click', editClue);
		};

		// Poor man's constructor overloading - initialise either from number/text/numeration or from an existing li
		if (arguments.length == 3)
			initClue(arguments[0], arguments[1], arguments[2]);
		else {
			li = arguments[0];
			li.addEventListener('click', editClue);
		}
	};

	var createClueLists = function(clueNumArr, lengthArr, box) {
		for (var i = 0; i < clueNumArr.length; i++) {
			var clue = new ClueInput(clueNumArr[i], '', lengthArr[i]);
			box.appendChild(clue.getListItem());
		}
	};

	return {
		registerListeners: function(select, change) {
			selectionCallback = select;
			changeCallback = change;
		},

		createClues: function(clueLists, clueNums, wordLengths) {
			createClueLists(clueNums.across, wordLengths.across, clueLists[0]);
			createClueLists(clueNums.down, wordLengths.down, clueLists[1]);
		},

		connectClues: function(clueLists) {
			for (var list = 0; list < clueLists.length; list++) {
				var lis = clueLists[list].getElementsByTagName('li');
				for (var i = 0; i < lis.length; i++) {
					ClueInput(lis[i]);
				}
			}
		},

		setNumeration: function(clueLists, direction, index, answer) {
			var li = clueLists[direction ? 1 : 0].getElementsByTagName('li')[index];
			var span = li.getElementsByClassName('numeration')[0];
			var numeration = answer.replace(/ /g, ',').replace(/[^-,]+/g, function(match) {
				return match.length;
			});
			span.innerHTML = ' (' + numeration + ')';
		},

		getIpuzClues: function(clueList) {
			var clues = [];
			var lis = clueList.getElementsByTagName('li');
			for (var i = 0; i < lis.length; i++) {
				var clueTextSpan = lis[i].getElementsByClassName('clue-text')[0];
				clues.push({
					number: parseInt(lis[i].getElementsByClassName('clue-number')[0].textContent),
					clue: clueTextSpan ? clueTextSpan.textContent : '',
					enumeration: lis[i].getElementsByClassName('numeration')[0].textContent.replace(/[ ()]/g, ''),
				});
			}

			return clues;
		},

		setIpuzClues: function(clueList, clues) {
			clueList.innerHTML = '';
			for (var i = 0; i < clues.length; i++) {
				var clue = new ClueInput(clues[i].number, clues[i].clue, clues[i].enumeration);
				clueList.appendChild(clue.getListItem());
			}
		},
	};
})();


var Display = (function() {
	var clearGridBox = function() {
		var i;
		var gridBox = document.getElementById('grid');

		var instructions = gridBox.getElementsByClassName('instructions');
		for (i = 0; i < instructions.length; i++)
			instructions[i].style.display = 'none';

		var squares = gridBox.querySelectorAll('.block, .light');
		for (i = 0; i < squares.length; i++)
			gridBox.removeChild(squares[i]);
	};

	return {
		clearGridBox: clearGridBox,

		hideRestart: function() {
			document.getElementById('restart').style.display = 'none';
		},

		hideCancel: function() {
			document.getElementById('cancel').style.display = 'none';
		},

		showIntroText: function() {
			document.getElementById('suggestions').style.display = 'none';
			document.getElementById('intro-message').style.display = 'block';
		},

		hideIntroText: function() {
			document.getElementById('suggestions').style.display = 'block';
			document.getElementById('intro-message').style.display = 'none';
		},

		showBlanks: function() {
			clearGridBox();
			document.getElementById('blanks').style.display = 'inline-block';
			document.getElementById('choose-grid-message').style.display = 'block';
		},

		hideBlanks: function() {
			clearGridBox();
			document.getElementById('blanks').style.display = 'none';
			document.getElementById('choose-grid-message').style.display = 'none';
		},

		showClues: function() {
			document.getElementById('clues').style.display = 'inline-block';
		},

		showHelpText: function() {
			document.getElementById('clues').style.display = 'none';
			document.getElementById('help-text').style.display = 'inline-block';
		},

		hideHelpText: function() {
			document.getElementById('help-text').style.display = 'none';
			document.getElementById('clues').style.display = 'inline-block';
		},

		showSaveForm: function() {
			document.getElementById('clues').style.display = 'none';
			document.getElementById('save-puzzle').style.display = 'inline-block';
		},
									
		hideSaveForm: function() {
			document.getElementById('save-puzzle').style.display = 'none';
			document.getElementById('clues').style.display = 'inline-block';
		},
	};
})();


var Storage = (function() {
	var storageName = 'create';

	var createIpuz = function(size, puzzle, solution, acrossClues, downClues) {
		var ipuz = {
			version: 'http://ipuz.org/v2',
			kind: ['http://ipuz.org/crossword#1'],
			dimensions: {'width': size, 'height': size},
			showenumerations: true,
			puzzle: puzzle,
			clues: {Across: acrossClues, Down: downClues},
			solution: solution,
		};

		return JSON.stringify(ipuz);
	};

	return {
		createIpuz: createIpuz,

		setStorageName: function(name) {
			storageName = name;
		},

		saveLocal: function(grid, clueLists) {
			var json = createIpuz(15, grid.getIpuzPuzzle(), grid.getIpuzSolution(),
								  ClueCreator.getIpuzClues(clueLists[0]),
								  ClueCreator.getIpuzClues(clueLists[1]));

			document.getElementById('save-ipuz').value = json;
			if (window.localStorage) {
				localStorage.setItem(storageName, json);
			}
		},

		loadLocal: function() {
			var json = localStorage.getItem(storageName);
			document.getElementById('save-ipuz').value = json;
			return json && JSON.parse(json);
		},

		clearLocal: function() {
			localStorage.removeItem(storageName);
			return true;
		},
	};
})();


/* exported PuzzleCreator */
var PuzzleCreator = (function() {
	var gridBox;
	var suggestionBox;
	var clueLists;
	var showIntro;
	var grid;
	var saveUrl;

	var suggestionAccepted = function(suggestion) {
		grid.setActiveEntry(suggestion.replace(/[^A-Z]/g, ''));
		ClueCreator.setNumeration(clueLists, grid.getActiveDirection(), grid.getActiveIndex(), suggestion.replace(/[^- A-Z]/g, ''));
		Storage.saveLocal(grid, clueLists);
	};

	var suggestionsCleared = function() {
		grid.resetActiveEntry();
		ClueCreator.setNumeration(clueLists, grid.getActiveDirection(), grid.getActiveIndex(), grid.getActiveEntry());
		Suggestor.showSuggestions(suggestionBox, grid.getActiveEntry(), suggestionAccepted, suggestionsCleared);
		Storage.saveLocal(grid, clueLists);
	};

	var gridChangeListener = function(changeType) {
		// New input
		var entry = grid.getActiveEntry();
		var checkers;

		// If the entry is complete, show alternatives
		if (entry.indexOf('.') == -1 && changeType == 'move') {
			checkers = grid.getActiveCheckers();
			if (checkers.search('[^\\.]') != -1)
				entry = checkers;
		}

		// Show suggestions, or intro text if the grid is still empty
		Display.hideIntroText();
		var found = Suggestor.showSuggestions(suggestionBox, entry, suggestionAccepted, suggestionsCleared);
		if (!found && showIntro)
			Display.showIntroText();
		
		// Save changes
		if (changeType == 'text') {
			Storage.saveLocal(grid, clueLists);
			Display.hideIntroText();
			showIntro = false;
		}
	};

	var clueSelected = function() {
		grid.clearActive();
		Suggestor.clearSuggestions();
	};

	var clueChanged = function() {
		Storage.saveLocal(grid, clueLists);
	};

	var editPuzzle = function() {
		Display.showIntroText()
		Display.showClues();
		GridCreator.connectControls(gridBox, grid, document.getElementById('ip'), document.getElementById('antique-IE'));
		ClueCreator.connectClues(clueLists);
		Storage.saveLocal(grid, clueLists);
		showIntro = true;
	};

	var restorePuzzle = function(saved, blockImgUrl) {
		Display.clearGridBox();
		Display.showClues();
		GridCreator.createIpuzGrid(gridBox, saved.puzzle, saved.solution, blockImgUrl);
		GridCreator.connectControls(gridBox, grid, document.getElementById('ip'), document.getElementById('antique-IE'));
		ClueCreator.setIpuzClues(clueLists[0], saved.clues.Across);
		ClueCreator.setIpuzClues(clueLists[1], saved.clues.Down);
		showIntro = false;
	};

	var newPuzzle = function(svg, blockImgUrl) {
		Display.hideBlanks();
		Display.showClues();
		Display.showIntroText();
		GridCreator.createBlankGrid(svg, gridBox, blockImgUrl);
		GridCreator.connectControls(gridBox, grid, document.getElementById('ip'), document.getElementById('antique-IE'));
		ClueCreator.createClues(clueLists, grid.getClueNums(), grid.getWordLengths());
		Storage.saveLocal(grid, clueLists);
	};

	var loadGridPicker = function(blockImgUrl) {
		Display.showBlanks();

		var thumbs = document.getElementsByTagName('svg');
		for (var i = 0; i < thumbs.length; i++) {
			thumbs[i].addEventListener('mouseenter', function() {
				Display.clearGridBox();
				GridCreator.createBlankGrid(this, gridBox, blockImgUrl);
			});

			thumbs[i].addEventListener('mouseleave', Display.showBlanks);
			
			thumbs[i].addEventListener('click', function() {
				this.removeEventListener('mouseleave', Display.showBlanks);
				newPuzzle(this, blockImgUrl);
			});
		}
	};

	return {
		init: function(wordListUrl, blockImgUrl, saveLocation, storage) {
			gridBox = document.getElementById('grid');
			suggestionBox = document.getElementById('suggestions');
			clueLists = document.getElementById('clues').getElementsByTagName('ul');
			showIntro = true;

			grid = new GridModule.Grid(15, gridChangeListener);
			Suggestor.loadWordList(wordListUrl);
			ClueCreator.registerListeners(clueSelected, clueChanged);

			if (saveLocation) {
				saveUrl = saveLocation;
				Storage.setStorageName(storage);
				Display.hideRestart();
			} else
				Display.hideCancel();

			var saved = Storage.loadLocal();
			if (saved)
				restorePuzzle(saved, blockImgUrl);
			else if (saveLocation)
				editPuzzle();
			else
				loadGridPicker(blockImgUrl);
		},

		printPuzzle: function() {
			ClassShim.addClass(gridBox, 'hide-solution');
			window.print();
			ClassShim.removeClass(gridBox, 'hide-solution');
		},

		printSolution: function() {
			window.print();
		},

		downloadIpuz: function() {
			var ipuz = Storage.createIpuz(15, grid.getIpuzPuzzle(), grid.getIpuzSolution(),
										  ClueCreator.getIpuzClues(clueLists[0]), ClueCreator.getIpuzClues(clueLists[1]));
			var blob = new Blob([ipuz], {type: 'text/plain;charset=iso-8859-1'});
			saveAs(blob, 'ThreePins.ipuz');
		},

		restart: function() {
			if (window.confirm('Do you want to discard this puzzle and start over?')) {
				Storage.clearLocal();
				document.location.reload(false);
			}
		},

		cancelEdit: function() {
			if (window.confirm('Do you want to cancel all changes and go back to the saved version?')) {
				Storage.clearLocal();
				window.location.href = saveUrl;
			}
		},

		validateSaveForm: function() {
			var username = document.getElementById('save-username');
			if (username && (username.value == null || username.value == '')) {
				alert('The pseudonym/username field must be filled in to save the puzzle.');
				return false;
			}

			var password = document.getElementById('save-password');
			if (password && (password.value == null || password.value == '')) {
				alert('The password field must be filled in to save the puzzle.');
				return false;
			}

			return true;
		},
	};
})();
