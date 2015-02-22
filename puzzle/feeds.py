from django.contrib.syndication.views import Feed
from django.core.urlresolvers import reverse
from django.utils import timezone
from puzzle.models import Puzzle

class PuzzleFeed(Feed):
    title = 'Three Pins'
    link = 'http://www.threepins.org'
    description = 'A cryptic crossword outlet.'

    def items(self):
        return Puzzle.objects.filter(pub_date__lte=timezone.now()).order_by('-pub_date')[:5]

    def item_title(self, item):
        return 'Crossword #' + str(item.number)

    def item_description(self, item):
        return 'Crossword #' + str(item.number) + ' is now available.'

    def item_link(self, item):
        return reverse('puzzle.views.puzzle', args=[item.number])

    def item_pubdate(self, item):
        return item.pub_date