from django.db import models
from django.core.urlresolvers import reverse
from django.utils import timezone
from datetime import datetime

BOOL_DOWN = ((True, 'Down'), (False, 'Across'))
PUZZLE_TYPES = ((0, 'Blocked'), (1, 'Barred'))

def default_author():
    return Author.objects.get(name='Cyborg')

def default_number():
    if Puzzle.objects.count():
        return Puzzle.objects.latest('number').number + 1
    return 0

def default_pub_date():
    return datetime(2100, 1, 1, 0, 0, 0)

class Author(models.Model):
    name = models.CharField(max_length=15)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

class Puzzle(models.Model):
    number = models.IntegerField(default=default_number)
    author = models.ForeignKey(Author, default=default_author)
    pub_date = models.DateTimeField('publication date', default=default_pub_date)
    size = models.IntegerField(default=15, editable=False)
    type = models.IntegerField(default=0, choices=PUZZLE_TYPES, editable=False)
    instructions = models.TextField(blank=True, null=True, editable=False)
    comments = models.TextField(blank=True)

    def __str__(self):
        return str(self.number)

    def get_absolute_url(self):
        if self.pub_date > timezone.now():
            return reverse('puzzle.views.preview', args=[self.number])
        else:
            return reverse('puzzle.views.puzzle', args=[self.number])

class Entry(models.Model):
    puzzle = models.ForeignKey(Puzzle)
    clue = models.CharField(max_length=200)
    answer = models.CharField(max_length=30)
    x = models.IntegerField()
    y = models.IntegerField()
    down = models.BooleanField('direction', choices=BOOL_DOWN, default=False)
    def __str__(self):
        return self.answer
