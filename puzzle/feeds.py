"""
Generate an RSS feed of published crosswords from staff users.

Uses the built-in feed framework. There's no attempt to send the actual
crossword, it's just a message indicating that a new one is available.
"""

from django.contrib.syndication.views import Feed
from django.urls import reverse
from django.utils import timezone
from puzzle.models import Puzzle

class PuzzleFeed(Feed):
    """RSS feed of new puzzles from the staff."""
    #pylint: disable=no-self-use,missing-docstring

    title = 'Three Pins'
    link = 'http://www.threepins.org'
    description = 'A cryptic crossword outlet.'

    def items(self):
        return Puzzle.objects.filter(user__is_staff=True,
                                     pub_date__lte=timezone.now()).order_by('-pub_date')[:5]

    def item_title(self, item):
        return 'Crossword #' + str(item.number)

    def item_description(self, item):
        return 'Crossword #' + str(item.number) + ' is now available.'

    def item_link(self, item):
        return reverse('puzzle', kwargs={'author': item.user.username, 'number': item.number})

    def item_pubdate(self, item):
        return item.pub_date
