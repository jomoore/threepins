from datetime import timedelta, datetime
from django.test import TestCase
from django.utils import timezone
from puzzle.models import Author, Puzzle
from puzzle.feeds import PuzzleFeed

class PuzzleModelTests(TestCase):
    def test_default_author(self):
        Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(number=0, pub_date=timezone.now())
        self.assertEqual(p.author.name, 'Test Author')

    def test_default_numbering(self):
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(author=a, pub_date=timezone.now())
        self.assertEqual(p.number, 0)
        p = Puzzle.objects.create(author=a, pub_date=timezone.now())
        self.assertEqual(p.number, 1)

    def test_default_pub_date(self):
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(number=0, author=a)
        self.assertTrue(p.pub_date > timezone.now())
        self.assertEqual(p.pub_date.year, 2100)
        self.assertEqual(p.pub_date.hour, 0)
        self.assertEqual(p.pub_date.second, 0)

    def test_published_puzzle_url(self):
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(pub_date=timezone.now())
        self.assertFalse('preview' in p.get_absolute_url())
        self.assertTrue(str(p.number) in p.get_absolute_url())

    def test_preview_puzzle_url(self):
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(pub_date=timezone.now() + timedelta(days=1))
        self.assertTrue('preview' in p.get_absolute_url())
        self.assertTrue(str(p.number) in p.get_absolute_url())

class FeedTests(TestCase):
    def get_author(self):
        if (Author.objects.count()):
            return Author.objects.first()
        else:
            return Author.objects.create(name='Test Author')

    def create_puzzle(self, number, pub_date):
        return Puzzle.objects.create(number=number, author=self.get_author(), pub_date=pub_date)

    def test_most_recent_first(self):
        self.create_puzzle(0, timezone.now() - timedelta(days=2))
        self.create_puzzle(1, timezone.now() - timedelta(days=1))
        self.create_puzzle(2, timezone.now())
        feed = PuzzleFeed()
        self.assertEqual(feed.items()[0].number, 2)
        self.assertEqual(feed.items()[1].number, 1)
        self.assertEqual(feed.items()[2].number, 0)

    def test_published_puzzles_only(self):
        self.create_puzzle(0, timezone.now() - timedelta(days=1))
        self.create_puzzle(1, timezone.now())
        self.create_puzzle(2, timezone.now() + timedelta(days=1))
        feed = PuzzleFeed()
        self.assertEqual(feed.items().count(), 2)
        self.assertEqual(feed.items()[0].number, 1)
        self.assertEqual(feed.items()[1].number, 0)

    def test_limited_number(self):
        num_puzzles = 10
        limit = 5
        for i in range(num_puzzles):
            self.create_puzzle(i, timezone.now() - timedelta(days=num_puzzles - i))
        feed = PuzzleFeed()
        self.assertEqual(feed.items().count(), limit)
