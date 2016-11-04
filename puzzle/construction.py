"""
Helper functions for constructing views.

Includes conversions between the database format, expanded grid info for rendering,
SVG thumbnails, and ipuz format for saving.
"""

import json
from re import sub, split
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.shortcuts import render
from django.utils import timezone
from django.utils.html import escape
from puzzle.models import Puzzle, Entry, Block, default_pub_date
from visitors.models import save_request

def create_grid(obj, size):
    """Create a 2D array describing each square of the puzzle.

    Each square gets a row, column, and type attribute.
    Numbered squares get a number, and light squares get a letter for the solution.
    The topmost row and leftmost column get extra markup to help render borders around the grid.
    """
    entries = Entry.objects.filter(puzzle=obj).order_by('y', 'x')
    grid = []
    number = 1

    # Initialise to a blank grid
    for row in range(size):
        grid.append([])
        for col in range(size):
            grid[row].append({'row': row, 'col': col, 'type': 'block',
                              'number': None, 'letter': None})

    # Populate with entries
    for entry in entries:
        row, col = entry.y, entry.x
        answer = sub("[' -]", '', entry.answer)
        if not grid[row][col]['number']:
            grid[row][col]['number'] = number
            number += 1
        for letter in answer:
            grid[row][col]['type'] = 'light'
            if letter != '.':
                grid[row][col]['letter'] = letter.upper()
            if entry.down:
                row += 1
            else:
                col += 1

    # Add some edges
    for i in range(size):
        grid[0][i]['type'] += ' topmost'
        grid[i][0]['type'] += ' leftmost'

    # All done!
    return grid

def create_thumbnail(blank, square_size):
    """Create an SVG of the blank grid."""
    blocks = Block.objects.filter(blank=blank.id)
    svg = '<svg width="%d" height="%d">' % (blank.size * square_size, blank.size * square_size)
    for y in range(blank.size):
        for x in range(blank.size):
            if any(b.x == x and b.y == y for b in blocks):
                fill = '0,0,0'
            else:
                fill = '255,255,255'
            svg += '<rect y="%d" x="%d" ' % (y * square_size, x * square_size)
            svg += 'width="%d" height="%d" ' % (square_size, square_size)
            svg += 'style="fill:rgb(%s);stroke-width:1;stroke:rgb(0,0,0)" />' % fill
    svg += '</svg>'
    return svg

def get_clues(obj, grid, down):
    """Get an array of across or down clues. Numeration is generated from the answer text."""
    entries = Entry.objects.filter(puzzle=obj, down=down).order_by('y', 'x')
    clues = []
    for entry in entries:
        numeration = sub(r'[^ -]+', lambda m: str(len(m.group(0))), sub("'", '', entry.answer))
        numeration = sub(' ', ',', numeration)
        clues.append({'number': grid[entry.y][entry.x]['number'], 'clue': entry.clue,
                      'numeration': numeration})
    return clues

def get_date_string(obj):
    """Helper to give the publish date in a nice British format."""
    return timezone.localtime(obj.pub_date).strftime('%d %b %Y')

def display_puzzle(request, obj, title, description, template):
    """Main helper to render a puzzle which has been pulled out of the database."""
    now = timezone.now()
    if obj.pub_date > now and request.user != obj.user and not request.user.is_staff:
        raise PermissionDenied

    grid = create_grid(obj, 15)
    across_clues = get_clues(obj, grid, False)
    down_clues = get_clues(obj, grid, True)

    prev_puzzle = Puzzle.objects.filter(user=obj.user, number__lt=obj.number).order_by('-number')
    next_puzzle = Puzzle.objects.filter(user=obj.user, number__gt=obj.number).order_by('number')
    if not request.user == obj.user:
        prev_puzzle = prev_puzzle.filter(pub_date__lte=now)
        next_puzzle = next_puzzle.filter(pub_date__lte=now)

    save_request(request)

    context = {'title': title, 'description': description, 'number': obj.number,
               'author': obj.user.username, 'grid': grid,
               'across_clues': across_clues, 'down_clues': down_clues,
               'date': get_date_string(obj) if obj.pub_date <= now else None,
               'next_puzzle': next_puzzle[0].number if next_puzzle else None,
               'prev_puzzle': prev_puzzle[0].number if prev_puzzle else None}
    return render(request, template, context)

def get_or_create_user(request):
    """Authenticate or create the user specified in the POST information."""
    username = request.POST['username']
    password = request.POST['password']
    email = request.POST['email']
    if User.objects.filter(username=username).count() == 0:
        user = User.objects.create_user(username, email, password)
    else:
        user = authenticate(username=username, password=password)
    return user

def get_start_position(grid_data, clue_num):
    """Find the start co-ordinates for a particular clue number in ipuz data."""
    for y, row in enumerate(grid_data):
        for x, cell in enumerate(row):
            if cell == clue_num:
                return {'x': x, 'y': y}

def get_answer(puzzle_data, clue, down, pos):
    """Extract a clue's answer from ipuz data."""
    blockChar = '#' if 'block' not in puzzle_data else puzzle_data['block']
    size = puzzle_data['dimensions']['width']
    numeration = split('([-,])', clue['enumeration'])
    x, y = pos['x'], pos['y']
    answer = ''
    group = 0

    while x < size and y < size:
        # Read one letter out of the solution array
        letter = puzzle_data['solution'][y][x]
        if letter == blockChar:
            break
        if letter == 0:
            letter = '.'
        answer += letter

        # Insert spaces and hypens based on the enumeration
        if group < (len(numeration) - 1) and len(answer) == int(numeration[group]):
            answer += sub(',', ' ', numeration[group + 1])
            group += 2

        # Move along to the next letter
        if down:
            y += 1
        else:
            x += 1

    return answer

def save_puzzle(user, number, ipuz, public):
    """Save a puzzle in ipuz format to the database."""
    puzzle_data = json.loads(ipuz)
    pub_date = timezone.now() if public else default_pub_date()

    # Remove any old data
    existing = Puzzle.objects.filter(user=user, number=number)
    if existing:
        existing[0].delete()

    # Create a new puzzle
    puz = Puzzle(user=user, number=number, pub_date=pub_date,
                 size=puzzle_data['dimensions']['width'])
    puz.save()

    # Extract entries from the ipuz data
    for direction in [{'name': 'Across', 'down': False}, {'name': 'Down', 'down': True}]:
        for entry in puzzle_data['clues'][direction['name']]:
            pos = get_start_position(puzzle_data['puzzle'], entry['number'])
            answer = get_answer(puzzle_data, entry, direction['down'], pos)
            entry = Entry(puzzle=puz, clue=escape(entry['clue']), answer=answer,
                          x=pos['x'], y=pos['y'], down=direction['down'])
            entry.save()
