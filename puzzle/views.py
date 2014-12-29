from re import sub
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.http import Http404
from puzzle.models import Author, Puzzle, Entry
from visitors.models import save_request

def create_grid(puzzle, size, show_answers):
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
        answer = sub('[ -]', '', e.answer)
        if not grid[row][col]['number']:
            grid[row][col]['number'] = number
            number += 1
        for letter in answer:
            grid[row][col]['type'] = 'light'
            if show_answers:
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

def get_clues(puzzle, grid, down):
    entries = Entry.objects.filter(puzzle=puzzle, down=down).order_by('y', 'x')
    clues = []
    for e in entries:
        numeration = sub(' ', ',', sub(r'[^ -]+', lambda m: str(len(m.group(0))), e.answer))
        clues.append({'number': grid[e.y][e.x]['number'], 'clue': e.clue, 'numeration': numeration })
    return clues

def get_date_string(puzzle):
    return timezone.localtime(puzzle.pub_date).strftime('%d %b %Y')

def display_puzzle(request, puzzle, title, description, show_answers=False, preview=False):
    grid = create_grid(puzzle, 15, show_answers)
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
               'next_puzzle': next_puzzle, 'prev_puzzle': prev_puzzle}
    return render(request, template, context)

def latest(request):
    p = Puzzle.objects.filter(pub_date__lte=timezone.now()).latest('pub_date')
    title = 'A cryptic crossword outlet'
    description = 'A free interactive site dedicated to amateur cryptic crosswords. Solve online or on paper.'
    return display_puzzle(request, p, title, description)

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

def preview(request, number):
    p = get_object_or_404(Puzzle, number=number)
    title = 'Preview #' + number
    return display_puzzle(request, p, title, title, False, True)

def preview_solution(request, number):
    p = get_object_or_404(Puzzle, number=number)
    title = 'Solution #' + number
    return display_puzzle(request, p, title, title, True, True)

def index(request):
    puzzles = Puzzle.objects.filter(pub_date__lte=timezone.now()).order_by('-pub_date')
    info = []
    for p in puzzles:
        info.append({'number': p.number, 'author': p.author, 'date': get_date_string(p)})
    context = { 'puzzles': info }
    return render(request, 'puzzle/index.html', context)
