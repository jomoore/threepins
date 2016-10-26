"""
Do all the real work to serve up a page.

Pull the details of puzzles and blank grids out of the database and
wrangle them into their templates.
"""

import json
from re import sub, split
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import escape
from django.views.decorators.gzip import gzip_page
from puzzle.models import Puzzle, Entry, Blank, Block, default_pub_date
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
               'prev_puzzle': prev_puzzle[0].number if prev_puzzle else None,
               'saved_new': 'new' in request.GET}
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

@gzip_page
def latest(request):
    """Show the latest published puzzle."""
    obj = Puzzle.objects.filter(user__is_staff=True,
                                pub_date__lte=timezone.now()).latest('pub_date')
    title = 'Three Pins - A cryptic crossword outlet'
    description = 'A free interactive site dedicated to amateur cryptic crosswords. ' \
                  'Solve online or on paper.'
    return display_puzzle(request, obj, title, description, 'puzzle/puzzle.html')

@gzip_page
def puzzle(request, author, number):
    """Show a puzzle by puzzle number."""
    obj = get_object_or_404(Puzzle, user__username=author, number=number)
    title = 'Crossword #' + number + ' | ' + author + ' | Three Pins'
    description = 'Crossword #' + number + 'by ' + author + ', first published on ' + \
                  get_date_string(obj) + '.'
    return display_puzzle(request, obj, title, description, 'puzzle/puzzle.html')

def puzzle_redirect(request, number):
    """Redirect from the old URL scheme where no author is specified."""
    author = User.objects.filter(is_staff=True).order_by('date_joined').first().username
    return redirect('puzzle', permanent=True, author=author, number=number)

@login_required
@gzip_page
def edit(request, author, number):
    """Edit a saved crossword."""
    obj = get_object_or_404(Puzzle, user__username=author, number=number)
    if request.user != obj.user and not request.user.is_staff:
        raise PermissionDenied
    title = 'Edit Crossword #' + number + ' | ' + author + ' | Three Pins'
    description = 'Edit crossword #' + number + 'by ' + author + ', first published on ' + \
                  get_date_string(obj) + '.'
    return display_puzzle(request, obj, title, description, 'puzzle/edit.html')

@gzip_page
def solution(request, author, number):
    """Show a solution by puzzle number."""
    obj = get_object_or_404(Puzzle, user__username=author, number=number)
    title = 'Solution #' + number + ' | ' + author + ' | Three Pins'
    return display_puzzle(request, obj, title, title, 'puzzle/solution.html')

@gzip_page
def create(request):
    """Initialise the online puzzle creation page with images of the available grids."""
    blanks = Blank.objects.all().order_by('display_order', 'id')
    thumbs = []
    for blank in blanks:
        thumbs.append(create_thumbnail(blank, 10))
    context = {'thumbs': thumbs}
    return render(request, 'puzzle/create.html', context)

@transaction.atomic
def save(request):
    """Save a puzzle to the database, then redirect to show it."""
    author = request.POST['author']
    number = request.POST['number']
    user = request.user

    if not request.user.is_authenticated:
        user = get_or_create_user(request)
        if user is None:
            return redirect('%s?next=%s' % (reverse('login'),
                                            request.META.get('HTTP_REFERER', '/')))
        login(request, user)

    if author and author != user.username:
        raise PermissionDenied

    next_url = ''
    if not number:
        previous = Puzzle.objects.filter(user=user).order_by('-number')
        number = previous[0].number + 1 if previous else 1
        next_url = '?new'
    next_url = reverse('puzzle', kwargs={'author': user.username, 'number': number}) + next_url

    save_puzzle(user, number, request.POST['ipuz'], 'visibility' in request.POST)
    return redirect(next_url)

def users(request):
    """Show a list of users and their puzzles."""
    context = {'user_list': []}
    for user in User.objects.all().order_by('username'):
        objs = Puzzle.objects.filter(user=user, pub_date__lte=timezone.now()).order_by('-number')
        if objs:
            puzzle_list = []
            for puz in objs:
                puzzle_list.append({'number': puz.number, 'date': get_date_string(puz)})
            context['user_list'].append({'name': user.username, 'puzzles': puzzle_list})
    return render(request, 'puzzle/users.html', context)

@login_required
def profile(request):
    """Show a list of puzzles belonging to the logged in user."""
    objs = Puzzle.objects.filter(user=request.user).order_by('-number')
    context = {'published': [], 'unpublished': []}
    now = timezone.now()
    for puz in objs.filter(pub_date__gt=now):
        context['unpublished'].append({'number': puz.number})
    for puz in objs.filter(pub_date__lte=now):
        context['published'].append({'number': puz.number, 'date': get_date_string(puz)})
    return render(request, 'puzzle/profile.html', context)
