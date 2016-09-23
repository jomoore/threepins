from re import sub
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.http import Http404
from django.views.decorators.gzip import gzip_page
from django.contrib.admin.views.decorators import staff_member_required
from puzzle.models import Author, Puzzle, Entry, Blank, Block
from visitors.models import save_request

def create_grid(puzzle, size):
    entries = Entry.objects.filter(puzzle=puzzle).order_by('y', 'x')
    grid = []
    number = 1

    # Initialise to a blank grid
    for row in range(size):
        grid.append([])
        for col in range(size):
            grid[row].append({'row': row, 'col': col, 'type': 'block', 'number': None, 'letter': None})

    # Populate with entries
    for e in entries:
        row, col = e.y, e.x
        answer = sub("[' -]", '', e.answer)
        if not grid[row][col]['number']:
            grid[row][col]['number'] = number
            number += 1
        for letter in answer:
            grid[row][col]['type'] = 'light'
            grid[row][col]['letter'] = letter.upper()
            if e.down:
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
    svg = '<svg width="%d" height="%d">' % (blank.size * square_size, blank.size * square_size)
    for y in range(0, blank.size):
        for x in range(0, blank.size):
            if (Block.objects.filter(blank=blank.id, x=x, y=y).exists()):
                fill = '0,0,0'
            else:
                fill = '255,255,255'
            svg += '<rect y="%d" x="%d" width="%d" height="%d" style="fill:rgb(%s);stroke-width:1;stroke:rgb(0,0,0)" />' % \
                   (y * square_size, x * square_size, square_size, square_size, fill)
    svg += '</svg>'
    return svg

def get_clues(puzzle, grid, down):
    entries = Entry.objects.filter(puzzle=puzzle, down=down).order_by('y', 'x')
    clues = []
    for e in entries:
        numeration = sub(r'[^ -]+', lambda m: str(len(m.group(0))), sub("'", '', e.answer))
        numeration = sub(' ', ',', numeration)
        clues.append({'number': grid[e.y][e.x]['number'], 'clue': e.clue, 'numeration': numeration })
    return clues

def get_date_string(puzzle):
    return timezone.localtime(puzzle.pub_date).strftime('%d %b %Y')

def display_puzzle(request, puzzle, title, description, show_answers=False, preview=False):
    grid = create_grid(puzzle, 15)
    across_clues = get_clues(puzzle, grid, False)
    down_clues = get_clues(puzzle, grid, True)
    next_puzzle = int(puzzle.number) + 1
    prev_puzzle = int(puzzle.number) - 1

    if prev_puzzle < 0:
        prev_puzzle = None

    if preview:
        if Puzzle.objects.filter(number=next_puzzle).count() == 0:
            next_puzzle = None
    elif Puzzle.objects.filter(number=next_puzzle, pub_date__lte=timezone.now()).count() == 0:
        next_puzzle = None

    if show_answers:
        template = 'puzzle/solution.html'
    elif preview:
        template = 'puzzle/preview.html'
    else:
        template = 'puzzle/puzzle.html'

    save_request(request)

    context = {'title': title, 'description': description, 'number': puzzle.number, 'date': get_date_string(puzzle),
               'author': puzzle.author.name, 'grid': grid, 'across_clues': across_clues, 'down_clues': down_clues,
               'show_answers': show_answers, 'next_puzzle': next_puzzle, 'prev_puzzle': prev_puzzle}
    return render(request, template, context)

@gzip_page
def latest(request):
    p = Puzzle.objects.filter(pub_date__lte=timezone.now()).latest('pub_date')
    title = 'A cryptic crossword outlet'
    description = 'A free interactive site dedicated to amateur cryptic crosswords. Solve online or on paper.'
    return display_puzzle(request, p, title, description)

@gzip_page
def puzzle(request, number):
    p = get_object_or_404(Puzzle, number=number)
    title = 'Crossword #' + number
    description = 'Crossword #' + number + ', first published on ' + get_date_string(p) + '.'
    if p.pub_date > timezone.now():
        raise Http404
    return display_puzzle(request, p, title, description)

def solution(request, number):
    p = get_object_or_404(Puzzle, number=number)
    title = 'Solution #' + number
    if p.pub_date > timezone.now():
        raise Http404
    return display_puzzle(request, p, title, title, True)

@staff_member_required
def preview(request, number):
    p = get_object_or_404(Puzzle, number=number)
    title = 'Preview #' + number
    return display_puzzle(request, p, title, title, False, True)

@staff_member_required
def preview_solution(request, number):
    p = get_object_or_404(Puzzle, number=number)
    title = 'Solution #' + number
    return display_puzzle(request, p, title, title, True, True)

def index(request):
    puzzles = Puzzle.objects.filter(pub_date__lte=timezone.now()).order_by('-pub_date')
    info = []
    for p in puzzles:
        info.append({'number': p.number, 'author': p.author, 'date': get_date_string(p)})
    context = {'puzzles': info}
    return render(request, 'puzzle/index.html', context)

@gzip_page
def create(request):
    blanks = Blank.objects.all().order_by('display_order', 'id');
    thumbs = []
    for b in blanks:
        thumbs.append(create_thumbnail(b, 10))
    context = {'thumbs': thumbs}
    return render(request, 'puzzle/create.html', context)
