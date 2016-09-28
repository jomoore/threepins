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
		if (input)
			container.appendChild(input);
	};

	var showSelectGridInstruction = function(container) {
		var p;
		var div;
			
		clearGridContainer(container);
		div = document.createElement('div');
		ClassShim.addClass(div, 'instructions');

		p = document.createElement('p');
		p.innerHTML = 'WELCOME TO THE CROSSWORD COMPOSER!';
		div.appendChild(p);

		p = document.createElement('p');
		p.innerHTML = 'HERE, YOU CAN CONSTRUCT YOUR OWN CROSSWORD ONLINE.';
		div.appendChild(p);

		p = document.createElement('p');
		p.innerHTML = 'TO BEGIN, CHOOSE YOUR GRID ';
		div.appendChild(p);

		container.appendChild(div);
	};

	var createBlankGrid = function(svg, container, blockImgUrl) {
		var number = 1;
		var rects = svg.getElementsByTagName('rect');
		var size = Math.sqrt(rects.length);

		var isBlock = [];
		for (var i = 0; i < rects.length; i++)
			isBlock.push(rects[i].style.fill.replace(/ /g, '') === 'rgb(0,0,0)');

		clearGridContainer(container);
		for (var i = 0; i < rects.length; i++) {
			var x = rects[i].x.baseVal.value / rects[i].width.baseVal.value;;
			var y = rects[i].y.baseVal.value / rects[i].height.baseVal.value;;

			// Create a square
			var sq = document.createElement('div');
			sq.setAttribute('data-x', x);
			sq.setAttribute('data-y', y);
			if (x == 0)
				ClassShim.addClass(sq, 'leftmost');
			if (y == 0)
				ClassShim.addClass(sq, 'topmost');
			if (isBlock[i])
				ClassShim.addClass(sq, 'block');
			else
				ClassShim.addClass(sq, 'light');

			if (!isBlock[i]) {
				// Add clue number
				var headAcross = ((x < size - 1) && !isBlock[i + 1] && (x == 0 || isBlock[i - 1]));
				var headDown = ((y < size - 1) && !isBlock[i + size] && (y == 0 || isBlock[i - size]));
				if (headAcross || headDown) {
					var gn = document.createElement('div');
					gn.innerHTML = number++;
					ClassShim.addClass(gn, 'grid-number');
					sq.appendChild(gn);
				}
			} else if (blockImgUrl) {
				// Add image for print
				var img = document.createElement('img');
				img.src = blockImgUrl;
				img.alt = 'block';
				sq.appendChild(img);
			}

			container.appendChild(sq);
		}
	};

	/* --- Display context --- */

	var showHelpText = function(box) {
		var helpText = document.createElement('p');
		ClassShim.addClass(helpText, 'help-text');
		helpText.innerHTML = "&uarr;<br>CLICK AND TYPE TO FIT SOME WORDS TOGETHER."
		box.appendChild(helpText);

		helpText = document.createElement('p');
		ClassShim.addClass(helpText, 'help-text');
		helpText.innerHTML = 'CLICK ON A CLUE TO EDIT IT. HAVE FUN! '
		box.appendChild(helpText);
	};

	function Suggestor(box, clearHandler, clickHandler) {
		var wordList = null;
		var re;
		var pattern;
		var requestId = 0;

		var appendClearButton = function() {
			var clearButton = document.createElement('span');
			clearButton.textContent = '--CLEAR--';
			ClassShim.addClass(clearButton, 'suggestion');
			clearButton.addEventListener('click', function(e) {
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

		var appendSuggestions = function(maxNum, req) {
			var result;
			var count = 0;

			if (req != requestId)
				return 0;
			
			while (count < maxNum && (result = re.exec(wordList[pattern.length])) !== null) {
				var suggestion = document.createElement('span');
				var spacer = document.createTextNode(' ');

				ClassShim.addClass(suggestion, 'suggestion');
				suggestion.innerHTML = result[0].toUpperCase().trim();
				suggestion.addEventListener('click', function(e) {
					clickHandler(this.innerHTML);
				});

				box.appendChild(suggestion);
				box.appendChild(spacer);
				++count;
			}

			if (count < maxNum)
				appendPadding();
			else
				window.setTimeout(appendSuggestions, 100, maxNum, req);

			return count;
		};

		this.clearSuggestions = function() {
			++requestId;
			box.innerHTML = '';
		}

		this.showSuggestions = function(searchPattern) {
			++requestId;
			box.innerHTML = '';
			pattern = searchPattern;
			var max = 200;

			if (wordList && pattern.search('[^\\.]') != -1) {
				appendClearButton();

				re = new RegExp('^' + pattern.replace(/./g, '$&\\W?') + '$', "gim");
				var count = appendSuggestions(max, requestId);

				if (count == 0) {
					var warning = document.createElement('span');
					ClassShim.addClass(warning, 'warning');
					warning.innerHTML = 'SORRY, NOTHING FITS HERE - '
					box.insertBefore(warning, box.firstChild);
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

		// Test hook
		this._setWordList = function(w) {
			wordList = w.split('$');
		};
	}

	return {
		showSelectGridInstruction: showSelectGridInstruction,
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
				ClassShim.addClass(text, 'clue-text');
				text.textContent = input.value;
				li.insertBefore(text, input);
			} else
				ClassShim.addClass(li, 'blank-clue');

			li.removeChild(input);
			ClassShim.addClass(li, 'select-clue');
			li.addEventListener('click', editClue);
		};

		var editClue = function(e) {
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
			for (i = 0; i < li.childNodes.length; i++)
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

		ClassShim.addClass(li, 'user-clue');
		ClassShim.addClass(li, 'select-clue');
		ClassShim.addClass(li, 'blank-clue');
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
