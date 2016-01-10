from datetime import timedelta, datetime
from django.test import TestCase
from django.utils import timezone
from puzzle.models import Author, Puzzle, Entry
from puzzle.feeds import PuzzleFeed
from puzzle.views import create_grid, get_clues, get_date_string

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

def create_small_puzzle():
    size = 3
    a = Author.objects.create(name='Test Author')
    p = Puzzle.objects.create(size=size)
    e0 = Entry.objects.create(puzzle=p, clue='1a', answer='ab c', x=0, y=0, down=False)
    e1 = Entry.objects.create(puzzle=p, clue='3a', answer='x-yz', x=0, y=2, down=False)
    e2 = Entry.objects.create(puzzle=p, clue='1d', answer='amx', x=0, y=0, down=True)
    e3 = Entry.objects.create(puzzle=p, clue='2d', answer='cnz', x=2, y=0, down=True)
    return p

class GridCreationTests(TestCase):
    def test_create_grid_pattern(self):
        grid = create_grid(create_small_puzzle(), 3)
        for row in range(3):
            for col in range(3):
                self.assertEqual(grid[row][col]['row'], row)
                self.assertEqual(grid[row][col]['col'], col)
                if row == 1 and col == 1:
                    self.assertFalse('light' in grid[row][col]['type'])
                    self.assertTrue('block' in grid[row][col]['type'])
                else:
                    self.assertTrue('light' in grid[row][col]['type'])
                    self.assertFalse('block' in grid[row][col]['type'])

    def test_create_grid_clue_numbers(self):
        grid = create_grid(create_small_puzzle(), 3)
        expected_numbers = [[1, None, 2], [None, None, None], [3, None, None]]
        for row in range(3):
            for col in range(3):
                self.assertEqual(grid[row][col]['number'], expected_numbers[row][col])

    def test_create_grid_letters(self):
        grid = create_grid(create_small_puzzle(), 3)
        expected_letters = [['A', 'B', 'C'], ['M', None, 'N'], ['X', 'Y', 'Z']]
        for row in range(3):
            for col in range(3):
                self.assertEqual(grid[row][col]['letter'], expected_letters[row][col])

    def test_create_grid_borders(self):
        grid = create_grid(create_small_puzzle(), 3)
        for row in range(3):
            for col in range(3):
                if row == 0:
                    self.assertTrue('topmost' in grid[row][col]['type'])
                else:
                    self.assertFalse('topmost' in grid[row][col]['type'])
                if col == 0:
                    self.assertTrue('leftmost' in grid[row][col]['type'])
                else:
                    self.assertFalse('leftmost' in grid[row][col]['type'])

class ClueCreationTests(TestCase):
    def test_get_clues(self):
        p = create_small_puzzle()
        grid = create_grid(p, 3)

        across_clues = get_clues(p, grid, False)
        self.assertEquals(len(across_clues), 2)
        self.assertEquals(across_clues[0]['number'], 1)
        self.assertEquals(across_clues[0]['clue'], '1a')
        self.assertEquals(across_clues[0]['numeration'], '2,1')
        self.assertEquals(across_clues[1]['number'], 3)
        self.assertEquals(across_clues[1]['clue'], '3a')
        self.assertEquals(across_clues[1]['numeration'], '1-2')

        down_clues = get_clues(p, grid, True)
        self.assertEquals(len(down_clues), 2)
        self.assertEquals(down_clues[0]['number'], 1)
        self.assertEquals(down_clues[0]['clue'], '1d')
        self.assertEquals(down_clues[0]['numeration'], '3')
        self.assertEquals(down_clues[1]['number'], 2)
        self.assertEquals(down_clues[1]['clue'], '2d')
        self.assertEquals(down_clues[1]['numeration'], '3')

class DateFormattingTests(TestCase):
    def test_get_date_string(self):
        dt = datetime(1980, 3, 4, 1, 2, 3, tzinfo=timezone.get_default_timezone())
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(pub_date=dt)
        self.assertEquals(get_date_string(p), '04 Mar 1980')
