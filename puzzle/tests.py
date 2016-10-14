"""
Unit tests for the puzzle application.

All tests run under the standard Django framework 'manage.py test'.
Unit test functions must start with 'test_' to be automatically detected.
"""

from datetime import timedelta, datetime
from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from django.contrib.auth.models import User
from puzzle.models import Puzzle, Entry, Blank, Block
from puzzle.feeds import PuzzleFeed
from puzzle.views import create_grid, create_thumbnail, get_clues, get_date_string
from puzzle.admin import import_from_xml, import_blank_from_ipuz
from visitors.models import Visitor

def get_user():
    """Helper to get the first user in the database, creating one if necessary."""
    if User.objects.count():
        return User.objects.first()
    else:
        return User.objects.create_user('test', 'test@example.com', 'password')

def create_small_puzzle():
    """Helper to insert a 3x3 puzzle into the database."""
    size = 3
    puzzle = Puzzle.objects.create(size=size, user=get_user())
    Entry.objects.create(puzzle=puzzle, clue='1a', answer='ab c', x=0, y=0, down=False)
    Entry.objects.create(puzzle=puzzle, clue='3a', answer='x-yz', x=0, y=2, down=False)
    Entry.objects.create(puzzle=puzzle, clue='1d', answer='amx', x=0, y=0, down=True)
    Entry.objects.create(puzzle=puzzle, clue='2d', answer='cnz', x=2, y=0, down=True)
    return puzzle

def create_puzzle_range():
    """Helper to add a bunch of small puzzles to the database, some published and some not."""
    for i in range(-2, 3):
        puzzle = create_small_puzzle()
        puzzle.pub_date = timezone.now() + timedelta(days=i)
        puzzle.save()

def create_empty_puzzle(number, pub_date):
    """Helper to add an empty puzzle to the database."""
    return Puzzle.objects.create(number=number, user=get_user(), pub_date=pub_date)

class PuzzleModelTests(TestCase):
    """Tests for new puzzle creation."""

    def test_default_user(self):
        """Check that the default user is applied to a new puzzle."""
        User.objects.create_superuser('super', 'super@example.com', 'password')
        puz = Puzzle.objects.create(number=0, pub_date=timezone.now())
        self.assertEqual(puz.user.username, 'super')

    def test_default_numbering(self):
        """Check that the default puzzle number is applied to a new puzzle."""
        puz = Puzzle.objects.create(user=get_user(), pub_date=timezone.now())
        self.assertEqual(puz.number, 0)
        puz = Puzzle.objects.create(user=get_user(), pub_date=timezone.now())
        self.assertEqual(puz.number, 1)

    def test_default_pub_date(self):
        """Check that the default publish date is applied to a new puzzle."""
        puz = Puzzle.objects.create(number=0, user=get_user())
        self.assertTrue(puz.pub_date > timezone.now())
        self.assertEqual(puz.pub_date.year, 2100)
        self.assertEqual(puz.pub_date.hour, 0)
        self.assertEqual(puz.pub_date.second, 0)

    def test_published_puzzle_url(self):
        """Check the absolute URL for a published puzzle."""
        puz = Puzzle.objects.create(user=get_user(), pub_date=timezone.now())
        self.assertNotIn('preview', puz.get_absolute_url())
        self.assertIn(str(puz.number), puz.get_absolute_url())

    def test_preview_puzzle_url(self):
        """Check the absolute URL for an unpublished puzzle."""
        puz = Puzzle.objects.create(user=get_user(), pub_date=timezone.now() + timedelta(days=1))
        self.assertIn('preview', puz.get_absolute_url())
        self.assertIn(str(puz.number), puz.get_absolute_url())


class FeedTests(TestCase):
    """Tests for RSS feed generation."""

    def test_most_recent_first(self):
        """Check that the RSS feed appears in reverse chronological order."""
        create_empty_puzzle(0, timezone.now() - timedelta(days=2))
        create_empty_puzzle(1, timezone.now() - timedelta(days=1))
        create_empty_puzzle(2, timezone.now())
        feed = PuzzleFeed()
        self.assertEqual(feed.items()[0].number, 2)
        self.assertEqual(feed.items()[1].number, 1)
        self.assertEqual(feed.items()[2].number, 0)

    def test_published_puzzles_only(self):
        """Check that unpublished puzzles don't appear in the feed."""
        create_empty_puzzle(0, timezone.now() - timedelta(days=1))
        create_empty_puzzle(1, timezone.now())
        create_empty_puzzle(2, timezone.now() + timedelta(days=1))
        feed = PuzzleFeed()
        self.assertEqual(feed.items().count(), 2)
        self.assertEqual(feed.items()[0].number, 1)
        self.assertEqual(feed.items()[1].number, 0)

    def test_limited_number(self):
        """Check that only the 5 most recent puzzles appear in the feed."""
        num_puzzles = 10
        limit = 5
        for i in range(num_puzzles):
            create_empty_puzzle(i, timezone.now() - timedelta(days=num_puzzles - i))
        feed = PuzzleFeed()
        self.assertEqual(feed.items().count(), limit)


class GridCreationTests(TestCase):
    """Tests for the grid rendering process."""

    def test_create_grid_pattern(self):
        """Check that the small 3x3 grid is rendered with the correct block pattern."""
        grid = create_grid(create_small_puzzle(), 3)
        for row in range(3):
            for col in range(3):
                self.assertEqual(grid[row][col]['row'], row)
                self.assertEqual(grid[row][col]['col'], col)
                if row == 1 and col == 1:
                    self.assertNotIn('light', grid[row][col]['type'])
                    self.assertIn('block', grid[row][col]['type'])
                else:
                    self.assertIn('light', grid[row][col]['type'])
                    self.assertNotIn('block', grid[row][col]['type'])

    def test_create_grid_clue_numbers(self):
        """Check that numbers have been added to the correct squares."""
        grid = create_grid(create_small_puzzle(), 3)
        expected_numbers = [[1, None, 2], [None, None, None], [3, None, None]]
        for row in range(3):
            for col in range(3):
                self.assertEqual(grid[row][col]['number'], expected_numbers[row][col])

    def test_create_grid_letters(self):
        """Check that letters of the solution have been added to the correct squares."""
        grid = create_grid(create_small_puzzle(), 3)
        expected_letters = [['A', 'B', 'C'], ['M', None, 'N'], ['X', 'Y', 'Z']]
        for row in range(3):
            for col in range(3):
                self.assertEqual(grid[row][col]['letter'], expected_letters[row][col])

    def test_create_grid_borders(self):
        """Check that topmost and leftmost attributes have been applied to the borders."""
        grid = create_grid(create_small_puzzle(), 3)
        for row in range(3):
            for col in range(3):
                if row == 0:
                    self.assertIn('topmost', grid[row][col]['type'])
                else:
                    self.assertNotIn('topmost', grid[row][col]['type'])
                if col == 0:
                    self.assertIn('leftmost', grid[row][col]['type'])
                else:
                    self.assertNotIn('leftmost', grid[row][col]['type'])


class ThumbnailTests(TestCase):
    """Tests of SVG creation for blank grids."""

    def test_create_thumbnail(self):
        """Create an SVG for a 3x3 blank grid."""
        blank = Blank.objects.create(id=1, size=3)
        Block.objects.create(blank=blank, y=0, x=2)
        Block.objects.create(blank=blank, y=1, x=0)
        Block.objects.create(blank=blank, y=2, x=1)
        svg = create_thumbnail(blank, 10)
        self.assertIn('<svg width="30" height="30">', svg)
        self.assertIn(
            'rect y="0" x="0" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn(
            'rect y="0" x="10" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn(
            'rect y="0" x="20" width="10" height="10" style="fill:rgb(0,0,0);', svg)
        self.assertIn(
            'rect y="10" x="0" width="10" height="10" style="fill:rgb(0,0,0);', svg)
        self.assertIn(
            'rect y="10" x="10" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn(
            'rect y="10" x="20" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn(
            'rect y="20" x="0" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn(
            'rect y="20" x="10" width="10" height="10" style="fill:rgb(0,0,0);', svg)
        self.assertIn(
            'rect y="20" x="20" width="10" height="10" style="fill:rgb(255,255,255);', svg)


class ClueCreationTests(TestCase):
    """Tests for clue rendering, including clue numbers and numeration."""

    def test_get_clues(self):
        """Create and check the clue lists for the small 3x3 puzzle."""
        puz = create_small_puzzle()
        grid = create_grid(puz, 3)

        across_clues = get_clues(puz, grid, False)
        self.assertEqual(len(across_clues), 2)
        self.assertEqual(across_clues[0]['number'], 1)
        self.assertEqual(across_clues[0]['clue'], '1a')
        self.assertEqual(across_clues[0]['numeration'], '2,1')
        self.assertEqual(across_clues[1]['number'], 3)
        self.assertEqual(across_clues[1]['clue'], '3a')
        self.assertEqual(across_clues[1]['numeration'], '1-2')

        down_clues = get_clues(puz, grid, True)
        self.assertEqual(len(down_clues), 2)
        self.assertEqual(down_clues[0]['number'], 1)
        self.assertEqual(down_clues[0]['clue'], '1d')
        self.assertEqual(down_clues[0]['numeration'], '3')
        self.assertEqual(down_clues[1]['number'], 2)
        self.assertEqual(down_clues[1]['clue'], '2d')
        self.assertEqual(down_clues[1]['numeration'], '3')


class DateFormattingTests(TestCase):
    """Tests for the date format shown above the puzzle."""

    def test_get_date_string(self):
        """Check that the date string is in the expected format."""
        test_date = datetime(1980, 3, 4, 1, 2, 3, tzinfo=timezone.get_default_timezone())
        puz = Puzzle.objects.create(user=get_user(), pub_date=test_date)
        self.assertEqual(get_date_string(puz), '04 Mar 1980')


class PuzzleViewTests(TestCase):
    """Tests for the various puzzle solving views."""

    def log_in_super_user(self):
        """Helper function to create and log in a superuser."""
        password = 'password'
        superuser = User.objects.create_superuser('super', 'super@example.com', password)
        self.client.login(username=superuser.username, password=password)

    def log_out_super_user(self):
        """Helper function to log out the superuser."""
        self.client.logout()

    def test_home_page_grid_squares(self):
        """Check that a puzzle grid has been rendered into the home page."""
        create_puzzle_range()
        response = self.client.get('/')
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertEqual(response.content.count('class="light'.encode('utf-8')), 8)
        self.assertEqual(response.content.count('class="block'.encode('utf-8')), (15 * 15) - 8)
        self.assertEqual(response.content.count('topmost'.encode('utf-8')), 15)
        self.assertEqual(response.content.count('leftmost'.encode('utf-8')), 15)
        self.assertEqual(response.content.count('class="grid-number"'.encode('utf-8')), 3)
        self.assertEqual(response.content.count('data-a='.encode('utf-8')), 8)
        for i in range(3):
            search_str = 'data-x="%i"' % i
            self.assertEqual(response.content.count(search_str.encode('utf-8')), 15)
            search_str = 'data-y="%i"' % i
            self.assertEqual(response.content.count(search_str.encode('utf-8')), 15)

    def test_home_page_clues(self):
        """Check that clues have been created and inserted into the page."""
        create_puzzle_range()
        response = self.client.get('/')
        self.assertContains(response, 'clue-box')
        self.assertEqual(response.content.count('clue-number'.encode('utf-8')), 4)

    def test_home_page_wrapping(self):
        """Check that the page has a title, description, and a link to the previous puzzle."""
        create_puzzle_range()
        response = self.client.get('/')
        self.assertContains(response, '<title>Three Pins - A cryptic crossword outlet</title>')
        self.assertContains(response, '<meta name="description" content="A free interactive site')
        self.assertContains(response, '&lt; Previous')
        self.assertNotContains(response, 'Next &gt;')
        self.assertContains(response, reverse('solution', args=[2]))

    def test_home_page_contains_latest(self):
        """Check that the puzzle number matches the latest published puzzle in the database."""
        create_puzzle_range()
        response = self.client.get('/')
        self.assertNotContains(response, 'data-number="1"')
        self.assertContains(response, 'data-number="2"')
        self.assertNotContains(response, 'data-number="3"')

    def test_home_page_answers_hidden(self):
        """Check that the solution is not visible."""
        create_puzzle_range()
        response = self.client.get('/')
        self.assertNotContains(response, 'class="letter"')

    def test_puzzle_without_previous(self):
        """Check that there is no 'previous' link when showing the very first puzzle."""
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[0]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="0"')
        self.assertNotContains(response, '&lt; Previous')
        self.assertContains(response, 'Next &gt;')
        self.assertContains(response, '<title>Three Pins - Crossword #0</title>')

    def test_next_and_previous(self):
        """Check that 'next' and 'previous' links are present when possible."""
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[1]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="1"')
        self.assertContains(response, '&lt; Previous')
        self.assertContains(response, 'Next &gt;')
        self.assertContains(response, '<title>Three Pins - Crossword #1</title>')

    def test_future_inaccessible(self):
        """Check that requests for unpublished puzzles receive a 404."""
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[3]))
        self.assertEqual(response.status_code, 404)

    def test_preview_requires_login(self):
        """Check that preview URLs redirect to a login page."""
        create_puzzle_range()
        response = self.client.get(reverse('preview', args=[3]))
        self.assertRedirects(response, '/admin/login/?next=/puzzle/preview/3/')

    def test_preview_future_puzzle(self):
        """Check that previews are visible to a logged in superuser."""
        create_puzzle_range()
        self.log_in_super_user()
        response = self.client.get(reverse('preview', args=[3]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="3"')
        self.assertNotContains(response, 'class="letter"')
        self.assertContains(response, '<title>Three Pins - Preview #3</title>')
        self.log_out_super_user()

    def test_solution_available(self):
        """Check that solutions are rendered into the solution page."""
        create_puzzle_range()
        response = self.client.get(reverse('solution', args=[2]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="2"')
        self.assertEqual(response.content.count('class="letter"'.encode('utf-8')), 8)
        self.assertContains(response, '<title>Three Pins - Solution #2</title>')

    def test_preview_solution_available(self):
        """Check that solutions are rendered into the preview solution page."""
        create_puzzle_range()
        self.log_in_super_user()
        response = self.client.get(reverse('preview_solution', args=[3]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="3"')
        self.assertEqual(response.content.count('class="letter"'.encode('utf-8')), 8)
        self.assertContains(response, '<title>Three Pins - Solution #3</title>')
        self.log_out_super_user()

    def test_invalid_puzzle(self):
        """Check that an invalid puzzle number results in a 404."""
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[100]))
        self.assertEqual(response.status_code, 404)

    def test_invalid_solution(self):
        """Check that an invalid solution number results in a 404."""
        create_puzzle_range()
        response = self.client.get(reverse('solution', args=[100]))
        self.assertEqual(response.status_code, 404)

    def test_invalid_preview(self):
        """Check that an invalid preview number results in a 404."""
        create_puzzle_range()
        self.log_in_super_user()
        response = self.client.get(reverse('preview', args=[100]))
        self.assertEqual(response.status_code, 404)
        self.log_out_super_user()

    def test_invalid_preview_solution(self):
        """Check that an invalid preview solution number results in a 404."""
        create_puzzle_range()
        self.log_in_super_user()
        response = self.client.get(reverse('preview_solution', args=[100]))
        self.assertEqual(response.status_code, 404)
        self.log_out_super_user()

    def test_index_list(self):
        """Check that the archive page lists all published puzzles."""
        create_puzzle_range()
        response = self.client.get(reverse('index'))
        self.assertNotContains(response, reverse('puzzle', args=[4]))
        self.assertNotContains(response, reverse('puzzle', args=[3]))
        self.assertContains(response, reverse('puzzle', args=[2]))
        self.assertContains(response, reverse('puzzle', args=[1]))
        self.assertContains(response, reverse('puzzle', args=[0]))

    def test_empty_index_list(self):
        """Check that the archive page still works if there are no puzzles in the database."""
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)


class PuzzleAdminTests(TestCase):
    """Tests for custom admin functionality."""

    def verify_entry(self, entry, expected):
        """Helper to check that an individual entry matches expected parameters."""
        self.assertEqual(entry.puzzle, expected['puzzle'])
        self.assertEqual(entry.clue, expected['clue'])
        self.assertEqual(entry.answer, expected['answer'])
        self.assertEqual(entry.x, expected['startx'])
        self.assertEqual(entry.y, expected['starty'])
        self.assertEqual(entry.down, expected['down'])

    def test_import_from_xml(self):
        """Import a test XML file and check the results."""
        puz = Puzzle.objects.create(user=get_user())
        import_from_xml('puzzle/test_data/small.xml', puz)
        entries = Entry.objects.order_by('down', 'y', 'x')
        self.verify_entry(entries[0], {'puzzle': puz, 'clue': '1a', 'answer': 'ab c',
                                       'startx': 0, 'starty': 0, 'down': False})
        self.verify_entry(entries[1], {'puzzle': puz, 'clue': '3a', 'answer': 'xyz',
                                       'startx': 0, 'starty': 2, 'down': False})
        self.verify_entry(entries[2], {'puzzle': puz, 'clue': '1d', 'answer': 'amx',
                                       'startx': 0, 'starty': 0, 'down': True})
        self.verify_entry(entries[3], {'puzzle': puz, 'clue': '2d', 'answer': 'c-nz',
                                       'startx': 2, 'starty': 0, 'down': True})

    def verify_block(self, block, blank, x_coord, y_coord):
        """Helper to check that an individual block matches expected parameters."""
        self.assertEqual(block.blank, blank)
        self.assertEqual(block.x, x_coord)
        self.assertEqual(block.y, y_coord)

    def verify_blocks_in_row(self, blocks, blank, row, expected_cols):
        """ Helper to check that one row of a grid has blocks in the expected columns.

        blocks - An array of block objects belonging one row of the grid.
        blank - The blank object they belong to.
        row - The row number.
        expected_cols - The column numbers which we expect to be blocks.
        """
        self.assertEqual(len(blocks), len(expected_cols))
        for idx, col in enumerate(expected_cols):
            self.verify_block(blocks[idx], blank, col, row)

    def test_import_from_ipuz(self):
        """Import a blank grid from an ipuz file and check the result."""
        blank = Blank.objects.create()
        file = open('puzzle/test_data/ettu.ipuz', 'rb')
        import_blank_from_ipuz(file, blank)
        blocks = Block.objects.order_by('y', 'x')
        self.verify_blocks_in_row(blocks[0:1], blank, 0, [11])
        self.verify_blocks_in_row(blocks[1:8], blank, 1, [1, 3, 5, 7, 9, 11, 13])
        self.verify_blocks_in_row(blocks[8:15], blank, 3, [1, 3, 5, 7, 9, 11, 13])
        self.verify_blocks_in_row(blocks[15:16], blank, 4, [5])
        self.verify_blocks_in_row(blocks[16:25], blank, 5, [0, 1, 3, 4, 5, 7, 9, 11, 13])
        self.verify_blocks_in_row(blocks[25:26], blank, 6, [6])
        self.verify_blocks_in_row(blocks[26:35], blank, 7, [1, 2, 3, 5, 7, 9, 11, 12, 13])
        self.verify_blocks_in_row(blocks[35:36], blank, 8, [8])
        self.verify_blocks_in_row(blocks[36:45], blank, 9, [1, 3, 5, 7, 9, 10, 11, 13, 14])
        self.verify_blocks_in_row(blocks[46:53], blank, 11, [1, 3, 5, 7, 9, 11, 13])
        self.verify_blocks_in_row(blocks[53:60], blank, 13, [1, 3, 5, 7, 9, 11, 13])
        self.verify_blocks_in_row(blocks[60:], blank, 14, [3])
        file.close()


class VisitorLogTests(TestCase):
    """Tests for visitor logging when a puzzle is viewed."""

    def test_log_visitor(self):
        """Check that one log entry per request is created."""
        create_puzzle_range()
        self.client.get('/')
        self.client.get('/')
        self.client.get('/')
        self.assertEqual(Visitor.objects.count(), 3)

    def test_limit_visitor_list(self):
        """Check that the 100 most recent visitors are kept in the log."""
        create_puzzle_range()
        start_time = timezone.now()
        for i in range(150):
            Visitor.objects.create(ip_addr='', user_agent='', path='', referrer='',
                                   date=start_time + timedelta(minutes=i))
        self.client.get('/')
        self.assertEqual(Visitor.objects.count(), 100)
        self.assertEqual(Visitor.objects.order_by('date').first().date,
                         start_time + timedelta(minutes=50))
        self.assertEqual(Visitor.objects.order_by('date').last().date,
                         start_time + timedelta(minutes=149))
