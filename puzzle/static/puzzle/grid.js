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

var GridModule = (function() {
	var ClassShim = (function() {
		return {
			addClass: function(el, className) {
				if (el.classList)
					el.classList.add(className);
				else
					el.className += ' ' + className;
			},

			removeClass: function(el, className) {
				if (el.classList)
					el.classList.remove(className);
				else {
					el.className = el.className.replace(
						new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
				}
			},

			hasClass: function(el, className) {
				if (el.classList)
					return el.classList.contains(className);
				else
					return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
			}
		};
	})();

	function Entry(x, y, down, length, target) {
		this.set = function(x, y, down, length, target) {
			this.x = x;
			this.y = y;
			this.down = down;
			this.length = length;
			this.target = target;
		};

		this.clear = function() {
			this.x = null;
			this.y = null;
			this.down = false;
			this.length = 0;
			this.target = 0;
		};

		this.iterate = function(f) {
			var x = this.x;
			var y = this.y;
			for (var i = 0; i < this.length; i++) {
				f(x, y);
				if (this.down)
					y++;
				else
					x++;
			}
		};

		this.set(x, y, down, length, target);
	}

	function Square() {
		this.head = false;
		this.light = false;
		this.div = null;
	}

	function Grid(size, container) {
		var number = container.getAttribute('data-number');
		var grid = [];
		var active = new Entry();

		/* --- Iterators --- */

		var iterateAll = function(f) {
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					f(x, y);
				}
			}
		};

		var iterateLights = function(f) {
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					if (grid[x][y].light) {
						f(x, y);
					}
				}
			}
		};

		/* --- Property tests --- */

		var headAcross = function(x, y) {
			return grid[x][y].head && x < (size - 1) && grid[x + 1][y].light && (x === 0 || !grid[x - 1][y].light);
		};

		var headDown = function(x, y) {
			return grid[x][y].head && y < (size - 1) && grid[x][y + 1].light && (y === 0 || !grid[x][y - 1].light);
		};

		var hasDirection = function(x, y, down) {
			if (down) {
				return grid[x][y].light &&
					((y > 0 && grid[x][y - 1].light) ||
					 (y < (size - 1) && grid[x][y + 1].light));
			} else {
				return grid[x][y].light &&
					((x > 0 && grid[x - 1][y].light) ||
					 (x < (size - 1) && grid[x + 1][y].light));
			}
		};

		/* --- Target control --- */

		var getTarget = function() {
			var x = active.x;
			var y = active.y;
			if (active.down)
				y += active.target;
			else
				x += active.target;

			return {x: x, y: y};
		};

		var isTarget = function(x, y) {
			var target = getTarget();
			return (x == target.x && y == target.y);
		};

		this.targetPosition = function() {
			var target = getTarget();
			return grid[target.x][target.y].div.offsetTop;
		};

		var clearHighlights = function() {
			active.iterate(function(x, y) {
				ClassShim.removeClass(grid[x][y].div, 'target');
				ClassShim.removeClass(grid[x][y].div, 'highlight');
			});
		};

		var setActive = function(x, y, down) {
			clearHighlights();
			active.set(x, y, down, 1, 0);
			ClassShim.addClass(grid[x][y].div, 'target');

			if (down) {
				while (active.y > 0 && grid[x][active.y - 1].light) {
					active.y--;
					active.length++;
					active.target++;
					ClassShim.addClass(grid[x][active.y].div, 'highlight');
				}

				while (y < (size - 1) && grid[x][y + 1].light) {
					y++;
					active.length++;
					ClassShim.addClass(grid[x][y].div, 'highlight');
				}
			} else {
				while (active.x > 0 && grid[active.x - 1][y].light) {
					active.x--;
					active.length++;
					active.target++;
					ClassShim.addClass(grid[active.x][y].div, 'highlight');
				}

				while (x < (size - 1) && grid[x + 1][y].light) {
					x++;
					active.length++;
					ClassShim.addClass(grid[x][y].div, 'highlight');
				}
			}
		};

		var doClearActive = function() {
			clearHighlights();
			active.clear();
		};

		this.clearActive = function() {
			doClearActive();
		};

		this.activateClicked = function(div) {
			var x = parseInt(div.getAttribute('data-x'));
			var y = parseInt(div.getAttribute('data-y'));
			var direction;

			if (!grid[x][y].light) {
				doClearActive();
				return false;
			} else if (isTarget(x, y)) {
				direction = hasDirection(x, y, !active.down) ? !active.down : active.down;
			} else if (headAcross(x, y) && !headDown(x, y)) {
				direction = false;
			} else if (headDown(x, y) && !headAcross(x, y)) {
				direction = true;
			} else {
				direction = hasDirection(x, y, active.down) ? active.down : !active.down;
			}

			setActive(x, y, direction);
			return true;
		};

		this.activateNext = function() {
			var x = active.x;
			var y = active.y;
			var down = active.down;

			while (y < size) {
				x++;

				if (x >= size) {
					x = 0;
					y++;
				}

				if (y >= size) {
					x = 0;
					y = 0;
					down = !down;
				}

				if (y < size && (!down && headAcross(x, y)) || (down && headDown(x, y))) {
					setActive(x, y, down);
					break;
				}
			}
		};

		this.activatePrevious = function() {
			var x = active.x;
			var y = active.y;
			var down = active.down;

			while (y >= 0) {
				x--;

				if (x < 0) {
					x = size - 1;
					y--;
				}

				if (y < 0) {
					x = size - 1;
					y = size - 1;
					down = !down;
				}

				if (y >= 0 && (!down && headAcross(x, y)) || (down && headDown(x, y))) {
					setActive(x, y, down);
					break;
				}
			}
		};

		this.isActive = function() {
			return active.length > 0;
		};

		this.moveTarget = function(dx, dy) {
			var target = getTarget();
			target.x += dx;
			target.y += dy;
			if (target.x >= 0 && target.x < size &&
				target.y >= 0 && target.y < size &&
				grid[target.x][target.y].light) {
				setActive(target.x, target.y, hasDirection(target.x, target.y, active.down) ? active.down : !active.down);
			}
		};

		/* --- Letter control --- */

		var getLetter = function(x, y) {
			var elList = grid[x][y].div.getElementsByClassName('letter');
			if (elList.length)
				return elList[0].innerHTML;
			else
				return '';
		};

		var clearLetter = function(x, y) {
			var elList = grid[x][y].div.getElementsByClassName('letter');
			if (elList.length)
				grid[x][y].div.removeChild(elList[0]);
		};

		var setLetter = function(x, y, letter) {
			clearLetter(x, y);

			var el = document.createElement('span');
			ClassShim.addClass(el, 'letter');
			el.innerHTML = letter.toUpperCase();

			grid[x][y].div.appendChild(el);
		};

		var revealLetter = function(x, y) {
			setLetter(x, y, grid[x][y].div.getAttribute('data-a'));
		};

		var checkLetter = function(x, y) {
			var enteredLetter = getLetter(x, y);
			var correctLetter = grid[x][y].div.getAttribute('data-a');
			if (enteredLetter != correctLetter)
				clearLetter(x, y);
		};

		var setTargetLetter = function(letter) {
			var target = getTarget();
			setLetter(target.x, target.y, letter);

			if (active.target < (active.length - 1)) {
				if (active.down)
					target.y++;
				else
					target.x++;

				setActive(target.x, target.y, active.down);
			}
		};

		var clearTargetLetter = function(backpedal) {
			var target = getTarget();
			clearLetter(target.x, target.y);

			if (backpedal && active.target > 0) {
				if (active.down)
					target.y--;
				else
					target.x--;

				setActive(target.x, target.y, active.down);
			}
		};

		var saveLetters = function(grid) {
			if (window.localStorage) {
				var letters = '';
				var nonEmpty = false;

				iterateLights(function(x, y) {
					var text = getLetter(x, y);
					if (text.length) {
						letters += text;
						nonEmpty = true;
					} else {
						letters += '.';
					}
				});

				if (nonEmpty)
					localStorage.setItem('puzzle' + number, letters);
				else
					localStorage.removeItem('puzzle' + number);
			}
		};

		var loadLetters = function(grid) {
			if (window.localStorage) {
				var letters = localStorage.getItem('puzzle' + number);
				if (letters) {
					var i = 0;
					iterateLights(function(x, y) {
						if (letters[i] !== '.')
							setLetter(x, y, letters[i]);
						i++;
					});
				}
			}
		};

		this.deleteTargetLetter = function(backpedal) {
			clearTargetLetter(backpedal);
			saveLetters();
		};

		this.updateLetters = function(prevInput, newInput) {
			if (newInput.length > prevInput.length) {
				for (var i = prevInput.length; i < newInput.length; i++)
					setTargetLetter(newInput[i]);
			} else if (prevInput.length > newInput.length) {
				for (var i = newInput.length; i < prevInput.length; i++)
					clearTargetLetter(true);
			} else {
				var change;
				for (change = 0; change < newInput.length; change++) {
					if (newInput[change] !== prevInput[change])
						break;
				}

				for (var i = change; i < newInput.length; i++)
					clearTargetLetter(true);

				for (var i = change; i < newInput.length; i++)
					setTargetLetter(newLetters[i]);
			}

			saveLetters();
		};

		/* --- Button handlers --- */

		this.checkAnswer = function() {
			active.iterate(checkLetter);
			doClearActive();
			saveLetters();
		};

		this.checkAll = function() {
			doClearActive();
			iterateLights(checkLetter);
			saveLetters();
		};

		this.showAnswer = function() {
			active.iterate(revealLetter);
			doClearActive();
			saveLetters();
		};

		this.showSolution = function() {
			iterateLights(revealLetter);
			doClearActive();
			saveLetters();
		};

		this.clearAll = function() {
			iterateLights(clearLetter);
			doClearActive();
			saveLetters();
		};

		/* --- Initialisation --- */

		var initGrid = function() {
			for (var x = 0; x < size; x++) {
				grid[x] = [];
				for (var y = 0; y < size; y++) {
					grid[x][y] = new Square();
				}
			}

			var elList = container.querySelectorAll('.block, .light');
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					var el = elList[y * size + x];
					grid[x][y].light = !ClassShim.hasClass(el, 'block');
					grid[x][y].head = el.getElementsByClassName('grid-number').length > 0;
					grid[x][y].div = el;
				}
			}
		};

		active.clear();
		initGrid();
		loadLetters();
	}

	/* The Android soft keyboard is spectacularly painful to work with.
	 * - It doesn't provide keypress events.
	 * - It provides keydown events but no keycode (except for number keys, bizarrely).
	 * - In the case of backspace, there's no event at all if there's no text to delete.
	 * - There's no way to make it pop up except to focus on an HTML input field.
	 *
	 * Sadly, HTML input fields are also a pain with this soft keyboard.
	 * - Focus can only be given in response to a click, not a keypress, so we can't jump around during text entry.
	 * - The behaviour is pretty unpredictable if you update the contents programmatically while the field has focus.
	 * - The maxlength setting isn't respected in the slightest.
	 * - The blue text selector aid appears whenever and wherever it feels like, including beyond the bounds of the box.
	 * - Input events fire asynchronously with a noticeable delay, so multiple keypresses can become a single input event.
	 *
	 * All those limitations have given rise to this particularly unfortunate workaround. The page contains
	 * a single invisible input field, positioned waaay off the left of the screen so that the blue cursor
	 * doesn't show up. We fill it with some lengthy dummy text so that backspace does something discernible,
	 * and examine deltas in its contents in lieu of getting nice sensible keypresses.
	 */
	function GridInput(grid, input) {
		var prevInput = '';

		var positionToTarget = function() {
			input.style.top = grid.targetPosition() + 'px';
		};

		var resetInput = function() {
			prevInput = '';
			for (var i = 0; i <= 100; i++)
				prevInput += '.';

			positionToTarget();
			input.focus();
			input.value = '';
			input.value = prevInput;
		};

		this.reset = function() {
			resetInput();
		};

		input.addEventListener('input', function(e) {
			if (grid.isActive()) {
				var newInput = input.value.replace(/ /g, '');
				grid.updateLetters(prevInput, newInput);
				prevInput = newInput;
				positionToTarget();
				e.preventDefault();
				return false;
			}
		});

		/* If there's a real keyboard, we can handle a few extra key events */
		input.addEventListener('keydown', function(e) {
			if (grid.isActive()) {
				switch (e.which) {
				case 8: /* Backspace */
					/* IE8 and 9 don't fire an input event on backspace. Catch the keypress instead. */
					if (document.getElementById('antique-IE')) {
						grid.deleteTargetLetter(true);
						resetInput();
						e.preventDefault();
						return false;
					}
					return true;
				case 9: /* Tab */
					if (e.shiftKey)
						grid.activatePrevious();
					else
						grid.activateNext();
					resetInput();
					e.preventDefault();
					return false;
				case 13: /* Return */
				case 27: /* Escape */
					grid.clearActive();
					e.preventDefault();
					return false;
				case 37: /* Left arrow */
					grid.moveTarget(-1, 0);
					resetInput();
					e.preventDefault();
					return false;
				case 38: /* Up arrow */
					grid.moveTarget(0, -1);
					resetInput();
					e.preventDefault();
					return false;
				case 39: /* Right arrow */
					grid.moveTarget(1, 0);
					resetInput();
					e.preventDefault();
					return false;
				case 40: /* Down arrow */
					grid.moveTarget(0, 1);
					resetInput();
					e.preventDefault();
					return false;
				case 46: /* Delete */
					grid.deleteTargetLetter(false);
					resetInput();
					e.preventDefault();
					return false;
				}
			}
		});
	}

	/* The page initially contains a link to the solution in case Javascript is disabled.
	 * Since it's enabled, we can remove the link and provide some buttons instead. */
	function ButtonBox(grid, div) {
		var checkButton = document.createElement('button');
		checkButton.innerHTML = 'Check';
		checkButton.addEventListener('click', function() {
			grid.checkAnswer();
		});

		var peekButton = document.createElement('button');
		peekButton.innerHTML = 'Peek';
		peekButton.addEventListener('click', function() {
			grid.showAnswer();
		});

		var printButton = document.createElement('button');
		printButton.innerHTML = 'Print';
		printButton.addEventListener('click', function() {
			window.print();
		});

		var checkAllButton = document.createElement('button');
		checkAllButton.innerHTML = 'Check All';
		checkAllButton.addEventListener('click', function() {
			grid.checkAll()
		});

		var solutionButton = document.createElement('button');
		solutionButton.innerHTML = 'Solution';
		solutionButton.addEventListener('click', function() {
			grid.showSolution();
			div.removeChild(solutionButton);
			div.appendChild(clearButton);
		});

		var clearButton = document.createElement('button');
		clearButton.innerHTML = 'Clear All';
		clearButton.addEventListener('click', function() {
			grid.clearAll();
			div.removeChild(clearButton);
			div.appendChild(solutionButton);
		});

		div.innerHTML = '';
		div.appendChild(checkButton);
		div.appendChild(peekButton);
		div.appendChild(printButton);
		div.appendChild(checkAllButton);
		div.appendChild(solutionButton);
	}

	return {
		Grid: Grid,
		GridInput: GridInput,
		ButtonBox: ButtonBox,
	};
})();
