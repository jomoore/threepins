$(document).ready(function() {
	function Entry(x, y, down, length, target) {
		this.set = function(x, y, down, length, target) {
			this.x = x;
			this.y = y;
			this.down = down;
			this.length = length;
			this.target = target;
		}

		this.clear = function() {
			this.x = null;
			this.y = null;
			this.down = false;
			this.length = 0;
			this.target = 0;
		}

		this.set(x, y, down, length, target);
	}

	function Square() {
		this.head = false;
		this.light = false;
		this.$div = null;
	}

	function Grid(size, $container) {
		this.number = $container.attr('data-number');
		var grid = [];
		var active = new Entry();

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
		}

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
		}

		this.targetPosition = function() {
			var target = getTarget();
			return grid[target.x][target.y].$div.position();
		};

		var clearHighlights = function() {
			var x = active.x;
			var y = active.y;
			for (var i = 0; i < active.length; i++) {
				grid[x][y].$div.removeClass('target');
				grid[x][y].$div.removeClass('highlight');
				if (active.down) 
					y++;
				else
					x++;
			}
		};

		var setActive = function(x, y, down) {
			clearHighlights();
			active.set(x, y, down, 1, 0);
			grid[x][y].$div.addClass('target');

			if (down) {
				while (active.y > 0 && grid[x][active.y - 1].light) {
					active.y--;
					active.length++;
					active.target++;
					grid[x][active.y].$div.addClass('highlight');
				}

				while (y < (size - 1) && grid[x][y + 1].light) {
					y++;
					active.length++;
					grid[x][y].$div.addClass('highlight');
				}
			} else {
				while (active.x > 0 && grid[active.x - 1][y].light) {
					active.x--;
					active.length++;
					active.target++;
					grid[active.x][y].$div.addClass('highlight');
				}

				while (x < (size - 1) && grid[x + 1][y].light) {
					x++;
					active.length++;
					grid[x][y].$div.addClass('highlight');
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

		this.activateClicked = function($div) {
			var x = parseInt($div.attr('data-x'));
			var y = parseInt($div.attr('data-y'));
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
			if (grid[target.x][target.y].light) {
				setActive(target.x, target.y, hasDirection(target.x, target.y, active.down) ? active.down : !active.down);
			}
		};

		var setLetter = function(letter) {
			var target = getTarget();
			grid[target.x][target.y].$div.children('.letter').remove();
			grid[target.x][target.y].$div.append('<span class="letter">' + letter.toUpperCase() + '</span>');

			if (active.target < (active.length - 1)) {
				if (active.down)
					target.y++;
				else
					target.x++;

				setActive(target.x, target.y, active.down);
			}
		};

		var clearLetter = function(backpedal) {
			var target = getTarget();
			grid[target.x][target.y].$div.children('.letter').remove();

			if (backpedal && active.target > 0) {
				if (active.down)
					target.y--;
				else
					target.x--;

				setActive(target.x, target.y, active.down);
			}
		};

		var revealLetter = function(x, y) {
			var letter = grid[x][y].$div.attr('data-a');
			grid[x][y].$div.children('.letter').remove();
			grid[x][y].$div.append('<span class="letter">' + letter.toUpperCase() + '</span>');
		}

		this.deleteLetter = function(backpedal) {
			clearLetter(backpedal);
		};

		this.updateLetters = function(prevInput, newInput) {
			if (newInput.length > prevInput.length) {
				for (var i = prevInput.length; i < newInput.length; i++)
					setLetter(newInput[i]);
			} else if (prevInput.length > newInput.length) {
				for (var i = newInput.length; i < prevInput.length; i++)
					clearLetter(true);
			} else {
				var change;
				for (change = 0; change < newInput.length; change++) {
					if (newInput[change] !== prevInput[change])
						break;
				}

				for (var i = change; i < newInput.length; i++)
					clearLetter(true);

				for (var i = change; i < newInput.length; i++)
					setLetter(newLetters[i]);
			}
		};

		this.exportLetters = function() {
			var letters = '';
			var nonEmpty = false;

			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					var text = grid[x][y].$div.children('.letter').first().text();
					if (text.length) {
						letters += text;
						nonEmpty = true;
					} else {
						letters += '.';
					}
				}
			}

			return nonEmpty ? letters : '';
		}

		this.importLetters = function(letters) {
			if (letters.length) {
				for (var y = 0; y < size; y++) {
					for (var x = 0; x < size; x++) {
						var letter = letters[y * size + x];
						if (letter !== '.') {
							grid[x][y].$div.append('<span class="letter">' + letter + '</span>');
						}
					}
				}
			}
		}

		this.checkAnswer = function() {
			var x = active.x;
			var y = active.y;
			for (var i = 0; i < active.length; i++) {
				var $letter = grid[x][y].$div.children('.letter').first();
				var enteredLetter = $letter.text();
				var correctLetter = grid[x][y].$div.attr('data-a');
				if (enteredLetter != correctLetter)
					$letter.css('color', 'red');
				if (active.down)
					y++;
				else
					x++;
			}
			doClearActive();
		}

		this.showAnswer = function() {
			var x = active.x;
			var y = active.y;
			for (var i = 0; i < active.length; i++) {
				revealLetter(x, y);
				if (active.down)
					y++;
				else
					x++;
			}
			doClearActive();
		}

		this.showSolution = function() {
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					if (grid[x][y].light) {
						revealLetter(x, y);
					}
				}
			}
			doClearActive();
		}

		this.clearAll = function() {
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					if (grid[x][y].light) {
						grid[x][y].$div.children('.letter').remove();
					}
				}
			}
			doClearActive();
		}

		var initGrid = function() {
			for (var x = 0; x < size; x++) {
				grid[x] = [];
				for (var y = 0; y < size; y++) {
					grid[x][y] = new Square();
				}
			}
		}

		var collectSquares = function() {
			var $div = $container.children('div').first();
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					grid[x][y].light = !$div.hasClass('block');
					grid[x][y].head = $div.children('.grid-number').length > 0;
					grid[x][y].$div = $div;
					$div = $div.next('div');
				}
			}
		};

		active.clear();
		initGrid();
		collectSquares();
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
	function GridInput(grid, $input, cookieManager) {
		var prevInput = '';

		var positionToTarget = function() {
			var p = grid.targetPosition();
			$input.css('top', p.top);
		};

		var resetInput = function() {
			prevInput = '';
			for (var i = 0; i <= 100; i++)
				prevInput += '.';

			positionToTarget($input);
			$input.focus();
			$input.val('');
			$input.val(prevInput);
		};

		this.reset = function() {
			resetInput();
		};

		$input.on('input', function() {
			if (grid.isActive()) {
				var newInput = $input.val().replace(/ /g, '');
				grid.updateLetters(prevInput, newInput);
				cookieManager.saveLetters(grid);
				prevInput = newInput;
				positionToTarget($input);
				return false;
			}
		});
	}

	/* The page initially contains a link to the solution in case Javascript is disabled.
	 * Since it's enabled, we can remove the link and provide some buttons instead. */
	function ButtonBox(grid, $div, cookieManager) {
		var $checkButton = $('<button>Check</button>');
		$checkButton.on('click', function() {
			grid.checkAnswer();
		});

		var $cheatButton = $('<button>Cheat</button>');
		$cheatButton.on('click', function() {
			grid.showAnswer();
			cookieManager.saveLetters(grid);
		});

		var $solutionButton = $('<button id="solution-button">Solution</button>');
		$solutionButton.on('click', function() {
			grid.showSolution();
			cookieManager.saveLetters(grid);
			$solutionButton.detach();
			$div.append($clearButton);
		});

		var $clearButton = $('<button id="clear-button">Clear All</button>');
		$clearButton.on('click', function() {
			grid.clearAll();
			cookieManager.saveLetters(grid);
			$clearButton.detach();
			$div.append($solutionButton);
		});

		$div.empty();
		$div.append($checkButton);
		$div.append($cheatButton);
		$div.append($solutionButton);
	}

	function CookieManager() {
		var WARNING_VERSION = '1';
		var WARNING_TEXT =
			'This site uses cookies to store puzzle progress. They will automatically expire after 30 days. ' +
			'If you would prefer not to have them, they can be <a href="http://www.aboutcookies.org/">disabled ' +
			'in your browser settings</a>.';

		/* Source: http://www.w3schools.com/js/js_cookies.asp */
		var setCookie = function(key, value, expiry, path) {
			var d = new Date();
			d.setTime(d.getTime() + (expiry * 24 * 60 * 60 * 1000));
			var str = key + "=" + value + "; " + "expires=" + d.toUTCString();
			document.cookie = key + "=" + value + "; " + "expires=" + d.toUTCString() + "; path=" + path;
		};

		var getCookie = function(key) {
			var name = key + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1);
				if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
			}
			return "";
		};

		this.saveLetters = function(grid) {
			var letters = grid.exportLetters();
			var expiry = letters.length ? 30 : -1;

			/* Set cookie on the root path for the benefit of puzzles shown on the home page */
			setCookie('puzzle' + grid.number, letters, expiry, '/');
		};

		this.loadLetters = function(grid) {
			grid.importLetters(getCookie('puzzle' + grid.number));
		};

		var $warning = $('<div id="cookie-warning">' + WARNING_TEXT + '</div>');
		var $button = $('<button>OK</button>');

		$warning.append($button);
		$button.on('click', function() {
			setCookie('cookiesAccepted', WARNING_VERSION, 90, '/');
			$warning.remove();
		});

		if (getCookie('cookiesAccepted') !== WARNING_VERSION)
			$warning.insertAfter('.puzzle');
	}

	/* Construct the grid */
	var cm = new CookieManager();
	var grid = new Grid(15, $('#grid'));
	var input = new GridInput(grid, $('#ip'), cm);
	var bb = new ButtonBox(grid, $('.buttons'), cm);
	cm.loadLetters(grid);

	$('#grid > div').on('mousedown', function() {
		if (grid.activateClicked($(this)))
			input.reset();
		return false;
	});

	/* If there's a real keyboard, we can handle a few extra key events */
	$('#ip').keydown(function(e) {
		if (grid.isActive()) {
			switch (e.which) {
			case 8: /* Backspace */
				/* IE8 and 9 don't fire an input event on backspace. Catch the keypress instead. */
				if ($('#antique-IE').length) {
					grid.deleteLetter(true);
					cm.saveLetters(grid);
					input.reset();
					return false;
				}
				return true;
			case 9: /* Tab */
				if (e.shiftKey)
					grid.activatePrevious();
				else
					grid.activateNext();
				input.reset();
				return false;
			case 13: /* Return */
			case 27: /* Escape */
				grid.clearActive();
				return false;
			case 37: /* Left arrow */
				grid.moveTarget(-1, 0);
				input.reset();
				return false;
			case 38: /* Up arrow */
				grid.moveTarget(0, -1);
				input.reset();
				return false;
			case 39: /* Right arrow */
				grid.moveTarget(1, 0);
				input.reset();
				return false;
			case 40: /* Down arrow */
				grid.moveTarget(0, 1);
				input.reset();
				return false;
			case 46: /* Delete */
				grid.deleteLetter(false);
				cm.saveLetters(grid);
				input.reset();
				return false;
			}
		}
	});
});
