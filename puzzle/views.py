"""
Do all the real work to serve up a page.

Pull the details of puzzles and blank grids out of the database and
wrangle them into their templates.
"""

from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.gzip import gzip_page
from puzzle.construction import display_puzzle, get_date_string
from puzzle.construction import create_thumbnail, get_or_create_user, save_puzzle
from puzzle.models import Puzzle, Blank

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

def puzzle_redirect(request, number): #pylint: disable=unused-argument
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
    public = 'visibility' in request.POST
    new_puzzle = not number
    user = request.user

    if not request.user.is_authenticated:
        user = get_or_create_user(request)
        if user is None:
            return redirect('%s?next=%s' % (reverse('login'),
                                            request.META.get('HTTP_REFERER', '/')))
        login(request, user)

    if author and author != user.username:
        raise PermissionDenied

    if new_puzzle:
        previous = Puzzle.objects.filter(user=user).order_by('-number')
        number = previous[0].number + 1 if previous else 1

    save_puzzle(user, number, request.POST['ipuz'], public)
    if new_puzzle:
        context = {'number': number, 'public': public}
        return render(request, 'puzzle/saved.html', context)
    else:
        return redirect('puzzle', author=user.username, number=number)

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
