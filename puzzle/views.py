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
from django.contrib.auth.models import User
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

    prev_puzzle = Puzzle.objects.filter(user=obj.user, number__lt=obj.number).order_by('-number')
    if 'preview' in template:
        next_puzzle = Puzzle.objects.filter(user=obj.user, number__gt=obj.number).order_by('number')
    else:
        next_puzzle = Puzzle.objects.filter(user=obj.user, number__gt=obj.number,
                                            pub_date__lte=timezone.now()).order_by('number')

    save_request(request)

    context = {'title': title, 'description': description, 'number': obj.number,
               'date': get_date_string(obj), 'author': obj.user.username, 'grid': grid,
               'across_clues': across_clues, 'down_clues': down_clues,
               'next_puzzle': next_puzzle[0].number if next_puzzle else None,
               'prev_puzzle': prev_puzzle[0].number if prev_puzzle else None}
    return render(request, template, context)

@gzip_page
def latest(request):
    """Show the latest published puzzle."""
    obj = Puzzle.objects.filter(user__is_staff=True,
                                pub_date__lte=timezone.now()).latest('pub_date')
    title = 'A cryptic crossword outlet'
    description = 'A free interactive site dedicated to amateur cryptic crosswords. '
    description += 'Solve online or on paper.'
    return display_puzzle(request, obj, title, description, 'puzzle/puzzle.html')

@gzip_page
def puzzle(request, user, number):
    """Show a puzzle by puzzle number."""
    obj = get_object_or_404(Puzzle, user__username=user, number=number)
    title = 'Crossword #' + number + ' | ' + user
    description = 'Crossword #' + number + 'by ' + user + ', first published on ' + \
                  get_date_string(obj) + '.'
    if obj.pub_date > timezone.now():
        raise Http404
    return display_puzzle(request, obj, title, description, 'puzzle/puzzle.html')

def solution(request, user, number):
    """Show a solution by puzzle number."""
    obj = get_object_or_404(Puzzle, user__username=user, number=number)
    title = 'Solution #' + number + ' | ' + user
    if obj.pub_date > timezone.now():
        raise Http404
    return display_puzzle(request, obj, title, title, 'puzzle/solution.html')

@staff_member_required
def preview(request, user, number):
    """Preview an unpublished puzzle."""
    obj = get_object_or_404(Puzzle, user__username=user, number=number)
    title = 'Preview #' + number + ' | ' + user
    return display_puzzle(request, obj, title, title, 'puzzle/preview.html')

@staff_member_required
def preview_solution(request, user, number):
    """Preview the solution of an unpublished puzzle."""
    obj = get_object_or_404(Puzzle, user__username=user, number=number)
    title = 'Solution #' + number + ' | ' + user
    return display_puzzle(request, obj, title, title, 'puzzle/preview_solution.html')

@gzip_page
def create(request):
    """Initialise the online puzzle creation page with images of the available grids."""
    blanks = Blank.objects.all().order_by('display_order', 'id')
    thumbs = []
    for blank in blanks:
        thumbs.append(create_thumbnail(blank, 10))
    context = {'thumbs': thumbs}
    return render(request, 'puzzle/create.html', context)

def users(request):
    """Show a list of users and their puzzles."""
    context = {'user_list': []}
    for user in User.objects.all().order_by('username'):
        objs = Puzzle.objects.filter(user=user, pub_date__lte=timezone.now()).order_by('-pub_date')
        if objs:
            puzzle_list = []
            for puz in objs:
                puzzle_list.append({'number': puz.number, 'date': get_date_string(puz)})
            context['user_list'].append({'name': user.username, 'puzzles': puzzle_list})
    return render(request, 'puzzle/users.html', context)
