"""
Data models for crosswords and blank grids.

The main ones are the Puzzle/Entry and Blank/Block pairs. Some stuff
is unused but included in the hopes of making future extension easier.
"""

from datetime import datetime
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth.models import User

BOOL_DOWN = ((True, 'Down'), (False, 'Across'))
PUZZLE_TYPES = ((0, 'Blocked'), (1, 'Barred'))

def default_user():
    """Default user for new puzzles."""
    user = User.objects.filter(is_staff=True).order_by('date_joined').first()
    return user.id if user else None

def default_number():
    """Default puzzle number is one greater than the last used."""
    if Puzzle.objects.count():
        return Puzzle.objects.latest('number').number + 1
    return 0

def default_pub_date():
    """Default publish date is way off in the future."""
    return datetime(2100, 1, 1, 0, 0, 0, tzinfo=timezone.get_default_timezone())

class Puzzle(models.Model):
    """Puzzles to solve. Non-editable fields are unused."""
    user = models.ForeignKey(User, models.CASCADE, default=default_user)
    number = models.IntegerField(default=default_number)
    pub_date = models.DateTimeField('publication date', default=default_pub_date)
    size = models.IntegerField(default=15, editable=False)
    type = models.IntegerField(default=0, choices=PUZZLE_TYPES, editable=False)
    instructions = models.TextField(blank=True, null=True, editable=False)
    comments = models.TextField(blank=True)

    class Meta:
        unique_together = (('user', 'number'),)

    def __str__(self):
        return str(self.number)

    def get_absolute_url(self):
        """Link to go from the puzzle's admin page to the puzzle itself."""
        return reverse('puzzle', args=[self.user.username, self.number])

class Entry(models.Model):
    """Individual clue/answer entries within a puzzle."""
    puzzle = models.ForeignKey(Puzzle, models.CASCADE)
    clue = models.CharField(max_length=200)
    answer = models.CharField(max_length=30)
    x = models.IntegerField()
    y = models.IntegerField()
    down = models.BooleanField('direction', choices=BOOL_DOWN, default=False)

    class Meta:
        verbose_name_plural = 'entries'

    def __str__(self):
        return self.answer

class Blank(models.Model):
    """Blank grids to use as templates when creating new puzzles online."""
    size = models.IntegerField(default=15, editable=False)
    display_order = models.IntegerField(default=100)
    def __str__(self):
        return str(self.id)

class Block(models.Model):
    """Block co-ordinates within each blank grid."""
    blank = models.ForeignKey(Blank, models.CASCADE)
    x = models.IntegerField()
    y = models.IntegerField()
