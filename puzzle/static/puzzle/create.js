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

	/* --- Select a grid --- */

	var clearGridContainer = function(container) {
		var input = container.getElementsByTagName('input')[0];
		container.innerHTML = '';
		container.appendChild(input);
	};

	var populateGridContainer = function(json, container) {
		var number = 1;
		var g = JSON.parse(json);
		
		clearGridContainer(container);
		for (var i = 0; i < g.isBlock.length; i++) {
			var x = i % g.size;
			var y = Math.floor(i / g.size);

			// Create a square
			var sq = document.createElement('div');
			sq.setAttribute('data-x', x);
			sq.setAttribute('data-y', y);
			if (x == 0)
				sq.classList.add('leftmost');
			if (y == 0)
				sq.classList.add('topmost');
			if (g.isBlock[i])
				sq.classList.add('block');
			else
				sq.classList.add('light');

			// Add clue number
			if (!g.isBlock[i]) {
				var headAcross = ((x < g.size - 1) && !g.isBlock[i + 1] && (x == 0 || g.isBlock[i - 1]));
				var headDown = ((y < g.size - 1) && !g.isBlock[i + g.size] && (y == 0 || g.isBlock[i - g.size]));
				if (headAcross || headDown) {
					var gn = document.createElement('div');
					gn.innerHTML = number++;
					gn.classList.add('grid-number');
					sq.appendChild(gn);
				}
			}

			container.appendChild(sq);
		}
	};

	function ConfirmButton(callback) {
		var button = document.createElement('button');

		var confirm = function() {
			button.parentNode.removeChild(button);
			callback();
		};

		this.append = function(box) {
			button.innerHTML = "OK, USE THIS ONE"
			button.classList.add('select-grid-button');
			button.addEventListener('click', confirm);
			box.innerHTML = '';
			box.appendChild(button);
		};
	}

	var createBlankGrid = function(id, target, buttonBox, callback) {
		var xhttp = new XMLHttpRequest();
		xhttp.onload = function(e) {
			populateGridContainer(xhttp.responseText, target);
			var confirmButton = new ConfirmButton(callback)
			confirmButton.append(buttonBox);
		};
		xhttp.open("GET", "blank/" + id);
		xhttp.send();
	};

	/* --- Display context --- */

	var showHelpText = function(box) {
		var helpText = document.createElement('p');
		helpText.classList.add('help-text');
		helpText.innerHTML = '&uarr;<br>CLICK AND TYPE TO FILL IN THE GRID'
		box.appendChild(helpText);

		helpText = document.createElement('p');
		helpText.classList.add('help-text');
		helpText.innerHTML = 'CLICK ON A CLUE TO EDIT IT &nearr;'
		box.appendChild(helpText);
	};

	function Suggestor(box, clearHandler, clickHandler) {
		var wordList = null;
		var re;
		var pattern;

		var appendClearButton = function() {
			var clearButton = document.createElement('span');
			clearButton.textContent = '*CLEAR*';
			clearButton.classList.add('suggestion');
			clearButton.addEventListener('click', function(e) {
				clearHandler();
			});
			box.appendChild(clearButton);
		};

		var appendSuggestions = function(maxNum) {
			var result;
			var count = 0;
			
			while (count < maxNum && (result = re.exec(wordList[pattern.length])) !== null) {
				var suggestion = document.createElement('span');
				var spacer = document.createTextNode(' ');

				suggestion.classList.add('suggestion');
				suggestion.innerHTML = result[0].toUpperCase();
				suggestion.addEventListener('click', function(e) {
					clickHandler(this.innerHTML);
				});

				box.appendChild(suggestion);
				box.appendChild(spacer);
				++count;
			}

			return count;
		};

		var appendContinuation = function() {
			var lastIndex = re.lastIndex;
			if (re.test(wordList[pattern.length])) {
				re.lastIndex = lastIndex;

				var continuation = document.createElement('span');
				continuation.classList.add('suggestion');
				continuation.innerHTML = '<br>more...';
				continuation.addEventListener('click', function(e) {
					box.removeChild(this);
					appendSuggestions(100000);
				});

				box.appendChild(continuation);
			}
		}

		this.clearSuggestions = function() {
			box.innerHTML = '';
		}

		this.showSuggestions = function(searchPattern) {
			box.innerHTML = '';
			pattern = searchPattern;
			var max = 200;

			if (wordList && pattern.search('[^\\.]') != -1) {
				appendClearButton();

				re = new RegExp('^' + pattern.replace(/./g, '$&\\W?') + '$', "gim");
				var count = appendSuggestions(max);

				if (count == max)
					appendContinuation();

				if (count == 0) {
					var warning = document.createElement('span');
					warning.classList.add('warning');
					warning.innerHTML = 'SORRY, NOTHING FITS HERE'
					box.appendChild(warning);
				}
			}
		};

		this.loadWordList = function(url) {
			var xhttp = new XMLHttpRequest();
			xhttp.onload = function(e) {
				wordList = xhttp.responseText.split('$');
			};
			xhttp.open("GET", url);
			xhttp.send();
		};
	}

	return {
		createBlankGrid: createBlankGrid,
		showHelpText: showHelpText,
		Suggestor: Suggestor,
	};
})();

var ClueCreator = (function() {
	function ClueInput(clueNum, wordLength, selectionCallback) {
		var li = document.createElement('li');
		this.getListItem = function() {
			return li;
		};

		var freezeClue = function(e) {
			input = e.target;
			if (input.value) {
				var text = document.createElement('span');
				text.classList.add('clue-text');
				text.textContent = input.value;
				li.insertBefore(text, input);
			} else
				li.classList.add('blank-clue');

			li.removeChild(input);
			li.classList.add('select-clue');
			li.addEventListener('click', editClue);
		};

		var editClue = function(e) {
			selectionCallback();
			li.classList.remove('select-clue', 'blank-clue');
			li.removeEventListener('click', editClue);

			var input = document.createElement('input');
			var clueText = li.getElementsByClassName('clue-text')[0];
			if (clueText) {
				input.value = clueText.textContent;
				li.removeChild(clueText);
			}

			var inputWidth = li.clientWidth;
			for (i = 0; i < li.childNodes.length; i++)
				inputWidth -= li.childNodes[i].offsetWidth;
			input.style.width = (inputWidth - 6) + 'px';

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

		li.classList.add('user-clue', 'select-clue', 'blank-clue');
		li.innerHTML = '<span class="clue-number">' + clueNum + ' </span><span class="numeration"> (' + wordLength + ')</span>';
		li.addEventListener('click', editClue);
	}

	var createClueLists = function(clueNumArr, lengthArr, box, selectionCallback) {
		for (var i = 0; i < clueNumArr.length; i++) {
			li = new ClueInput(clueNumArr[i], lengthArr[i], selectionCallback);
			box.appendChild(li.getListItem());
		}
	};

	var createClues = function(clueLists, clueNums, wordLengths, selectionCallback) {
		createClueLists(clueNums.across, wordLengths.across, clueLists[0], selectionCallback);
		createClueLists(clueNums.down, wordLengths.down, clueLists[1], selectionCallback);
	}

	var setNumeration = function(clueLists, direction, index, answer) {
		var li = clueLists[direction ? 1 : 0].getElementsByTagName('li')[index];
		var span = li.getElementsByClassName('numeration')[0];
		var numeration = answer.replace(/ /g, ',').replace(/[^-,]+/g, function(match, offset, string) {
			return match.length;
		});
		span.innerHTML = ' (' + numeration + ')';
	};

	var getIpuzClues = function(clueList) {
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
	};

	return {
		createClues: createClues,
		setNumeration: setNumeration,
		getIpuzClues: getIpuzClues,
	};
})();

var PuzzleCreator = (function() {
	var createIpuz = function(size, puzzle, solution, acrossClues, downClues) {
		var ipuz = {
			version: "http://ipuz.org/v2",
			kind: ["http://ipuz.org/crossword#1"],
			dimensions: {"width": size, "height": size},
			showenumerations: true,
			puzzle: puzzle,
			clues: {Across: acrossClues, Down: downClues},
			solution: solution,
		};

		return JSON.stringify(ipuz);
	};

	return {
		createIpuz: createIpuz,
	};
})();
