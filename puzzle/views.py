"""
Do all the real work to serve up a page.

Pull the details of puzzles and blank grids out of the database and
wrangle them into their templates.
"""

from re import sub
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.http import Http404
from django.views.decorators.gzip import gzip_page
from django.contrib.admin.views.decorators import staff_member_required
from puzzle.models import Puzzle, Entry, Blank, Block
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
    grid = create_grid(obj, 15)
    across_clues = get_clues(obj, grid, False)
    down_clues = get_clues(obj, grid, True)
    next_puzzle = int(obj.number) + 1
    prev_puzzle = int(obj.number) - 1

    if prev_puzzle < 0:
        prev_puzzle = None

    if 'preview' in template:
        if Puzzle.objects.filter(number=next_puzzle).count() == 0:
            next_puzzle = None
    elif Puzzle.objects.filter(number=next_puzzle, pub_date__lte=timezone.now()).count() == 0:
        next_puzzle = None

    save_request(request)

    context = {'title': title, 'description': description, 'number': obj.number,
               'date': get_date_string(obj), 'author': obj.user.username, 'grid': grid,
               'across_clues': across_clues, 'down_clues': down_clues,
               'next_puzzle': next_puzzle, 'prev_puzzle': prev_puzzle}
    return render(request, template, context)

@gzip_page
def latest(request):
    """Show the latest published puzzle."""
    obj = Puzzle.objects.filter(pub_date__lte=timezone.now()).latest('pub_date')
    title = 'A cryptic crossword outlet'
    description = 'A free interactive site dedicated to amateur cryptic crosswords. '
    description += 'Solve online or on paper.'
    return display_puzzle(request, obj, title, description, 'puzzle/puzzle.html')

@gzip_page
def puzzle(request, number):
    """Show a puzzle by puzzle number."""
    obj = get_object_or_404(Puzzle, number=number)
    title = 'Crossword #' + number
    description = 'Crossword #' + number + ', first published on ' + get_date_string(obj) + '.'
    if obj.pub_date > timezone.now():
        raise Http404
    return display_puzzle(request, obj, title, description, 'puzzle/puzzle.html')

def solution(request, number):
    """Show a solution by puzzle number."""
    obj = get_object_or_404(Puzzle, number=number)
    title = 'Solution #' + number
    if obj.pub_date > timezone.now():
        raise Http404
    return display_puzzle(request, obj, title, title, 'puzzle/solution.html')

@staff_member_required
def preview(request, number):
    """Preview an unpublished puzzle."""
    obj = get_object_or_404(Puzzle, number=number)
    title = 'Preview #' + number
    return display_puzzle(request, obj, title, title, 'puzzle/preview.html')

@staff_member_required
def preview_solution(request, number):
    """Preview the solution of an unpublished puzzle."""
    obj = get_object_or_404(Puzzle, number=number)
    title = 'Solution #' + number
    return display_puzzle(request, obj, title, title, 'puzzle/preview_solution.html')

def index(request):
    """Show a list of all published puzzles."""
    puzzles = Puzzle.objects.filter(pub_date__lte=timezone.now()).order_by('-pub_date')
    info = []
    for puz in puzzles:
        info.append({'number': puz.number, 'author': puz.user.username,
                     'date': get_date_string(puz)})
    context = {'puzzles': info}
    return render(request, 'puzzle/index.html', context)

@gzip_page
def create(request):
    """Initialise the online puzzle creation page with images of the available grids."""
    blanks = Blank.objects.all().order_by('display_order', 'id')
    thumbs = []
    for blank in blanks:
        thumbs.append(create_thumbnail(blank, 10))
    context = {'thumbs': thumbs}
    return render(request, 'puzzle/create.html', context)
