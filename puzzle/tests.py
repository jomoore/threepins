from datetime import timedelta, datetime
from django.test import TestCase
from django.utils import timezone
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from puzzle.models import Author, Puzzle, Entry, Blank, Block
from puzzle.feeds import PuzzleFeed
from puzzle.views import create_grid, create_thumbnail, get_clues, get_date_string
from puzzle.admin import import_from_xml
from visitors.models import Visitor

def create_small_puzzle():
    size = 3
    a = Author.objects.create(name='Test Author')
    p = Puzzle.objects.create(size=size)
    e0 = Entry.objects.create(puzzle=p, clue='1a', answer='ab c', x=0, y=0, down=False)
    e1 = Entry.objects.create(puzzle=p, clue='3a', answer='x-yz', x=0, y=2, down=False)
    e2 = Entry.objects.create(puzzle=p, clue='1d', answer='amx', x=0, y=0, down=True)
    e3 = Entry.objects.create(puzzle=p, clue='2d', answer='cnz', x=2, y=0, down=True)
    return p

def create_puzzle_range():
    for i in range(-2, 3):
        p = create_small_puzzle()
        p.pub_date = pub_date=timezone.now() + timedelta(days=i)
        p.save()

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
        self.assertNotIn('preview', p.get_absolute_url())
        self.assertIn(str(p.number), p.get_absolute_url())

    def test_preview_puzzle_url(self):
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create(pub_date=timezone.now() + timedelta(days=1))
        self.assertIn('preview', p.get_absolute_url())
        self.assertIn(str(p.number), p.get_absolute_url())

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

class GridCreationTests(TestCase):
    def test_create_grid_pattern(self):
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
                    self.assertIn('topmost', grid[row][col]['type'])
                else:
                    self.assertNotIn('topmost', grid[row][col]['type'])
                if col == 0:
                    self.assertIn('leftmost', grid[row][col]['type'])
                else:
                    self.assertNotIn('leftmost', grid[row][col]['type'])

class ThumbnailTests(TestCase):
    def test_create_thumbnail(self):
        blank = Blank.objects.create(id=1, size=3)
        b0 = Block.objects.create(blank=blank, y=0, x=2)
        b1 = Block.objects.create(blank=blank, y=1, x=0)
        b2 = Block.objects.create(blank=blank, y=2, x=1)
        svg = create_thumbnail(blank, 10)
        self.assertIn('<svg width="30" data-id="1">', svg)
        self.assertIn('rect x="0" y="0" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn('rect x="10" y="0" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn('rect x="20" y="0" width="10" height="10" style="fill:rgb(0,0,0);', svg)
        self.assertIn('rect x="0" y="10" width="10" height="10" style="fill:rgb(0,0,0);', svg)
        self.assertIn('rect x="10" y="10" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn('rect x="20" y="10" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn('rect x="0" y="20" width="10" height="10" style="fill:rgb(255,255,255);', svg)
        self.assertIn('rect x="10" y="20" width="10" height="10" style="fill:rgb(0,0,0);', svg)
        self.assertIn('rect x="20" y="20" width="10" height="10" style="fill:rgb(255,255,255);', svg)

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

class PuzzleViewTests(TestCase):
    def log_in_super_user(self):
        password = 'password'
        superuser = User.objects.create_superuser('test', 'test@example.com', password)
        self.client.login(username=superuser.username, password=password)

    def log_out_super_user(self):
        self.client.logout()

    def test_home_page_grid_squares(self):
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
        create_puzzle_range()
        response = self.client.get('/')
        self.assertContains(response, 'clue-box')
        self.assertEqual(response.content.count('clue-number'.encode('utf-8')), 4)

    def test_home_page_wrapping(self):
        create_puzzle_range()
        response = self.client.get('/')
        self.assertContains(response, '<title>Three Pins - A cryptic crossword outlet</title>')
        self.assertContains(response, '<meta name="description" content="A free interactive site')
        self.assertContains(response, '&lt; Previous')
        self.assertNotContains(response, 'Next &gt;')
        self.assertContains(response, reverse('solution', args=[2]))

    def test_home_page_contains_latest(self):
        create_puzzle_range()
        response = self.client.get('/')
        self.assertNotContains(response, 'data-number="1"')
        self.assertContains(response, 'data-number="2"')
        self.assertNotContains(response, 'data-number="3"')

    def test_home_page_answers_hidden(self):
        create_puzzle_range()
        response = self.client.get('/')
        self.assertNotContains(response, 'class="letter"')

    def test_puzzle_without_previous(self):
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[0]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="0"')
        self.assertNotContains(response, '&lt; Previous')
        self.assertContains(response, 'Next &gt;')
        self.assertContains(response, '<title>Three Pins - Crossword #0</title>')

    def test_puzzle_with_next_and_previous(self):
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[1]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="1"')
        self.assertContains(response, '&lt; Previous')
        self.assertContains(response, 'Next &gt;')
        self.assertContains(response, '<title>Three Pins - Crossword #1</title>')

    def test_future_puzzle_not_accessible(self):
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[3]))
        self.assertEqual(response.status_code, 404)

    def test_preview_requires_login(self):
        create_puzzle_range()
        response = self.client.get(reverse('preview', args=[3]))
        self.assertRedirects(response, '/admin/login/?next=/puzzle/preview/3/')

    def test_preview_future_puzzle(self):
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
        create_puzzle_range()
        response = self.client.get(reverse('solution', args=[2]))
        self.assertContains(response, 'class="puzzle"')
        self.assertContains(response, 'id="grid"')
        self.assertContains(response, 'data-number="2"')
        self.assertEqual(response.content.count('class="letter"'.encode('utf-8')), 8)
        self.assertContains(response, '<title>Three Pins - Solution #2</title>')

    def test_preview_solution_available(self):
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
        create_puzzle_range()
        response = self.client.get(reverse('puzzle', args=[100]))
        self.assertEqual(response.status_code, 404)

    def test_invalid_solution(self):
        create_puzzle_range()
        response = self.client.get(reverse('solution', args=[100]))
        self.assertEqual(response.status_code, 404)

    def test_invalid_preview(self):
        create_puzzle_range()
        self.log_in_super_user()
        response = self.client.get(reverse('preview', args=[100]))
        self.assertEqual(response.status_code, 404)
        self.log_out_super_user()

    def test_invalid_preview_solution(self):
        create_puzzle_range()
        self.log_in_super_user()
        response = self.client.get(reverse('preview_solution', args=[100]))
        self.assertEqual(response.status_code, 404)
        self.log_out_super_user()

    def test_index_list(self):
        create_puzzle_range()
        response = self.client.get(reverse('index'))
        self.assertNotContains(response, reverse('puzzle', args=[4]))
        self.assertNotContains(response, reverse('puzzle', args=[3]))
        self.assertContains(response, reverse('puzzle', args=[2]))
        self.assertContains(response, reverse('puzzle', args=[1]))
        self.assertContains(response, reverse('puzzle', args=[0]))

    def test_empty_index_list(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)

class PuzzleAdminTests(TestCase):
    def verify_entry(self, entry, puzzle, clue, answer, x, y, down):
        self.assertEqual(entry.puzzle, puzzle)
        self.assertEqual(entry.clue, clue)
        self.assertEqual(entry.answer, answer)
        self.assertEqual(entry.x, x)
        self.assertEqual(entry.y, y)
        self.assertEqual(entry.down, down)

    def test_import_from_xml(self):
        a = Author.objects.create(name='Test Author')
        p = Puzzle.objects.create()
        import_from_xml('puzzle/test_data/small.xml', p)
        entries = Entry.objects.order_by('down', 'y', 'x')
        self.verify_entry(entries[0], p, '1a', 'ab c', 0, 0, False)
        self.verify_entry(entries[1], p, '3a', 'xyz', 0, 2, False)
        self.verify_entry(entries[2], p, '1d', 'amx', 0, 0, True)
        self.verify_entry(entries[3], p, '2d', 'c-nz', 2, 0, True)

class VisitorLogTests(TestCase):
    def test_log_visitor(self):
        create_puzzle_range()
        self.client.get('/')
        self.client.get('/')
        self.client.get('/')
        self.assertEqual(Visitor.objects.count(), 3)

    def test_limit_visitor_list(self):
        create_puzzle_range()
        start_time = timezone.now()
        for i in range(150):
            Visitor.objects.create(ip_addr='', user_agent='', path='', referrer='', date=start_time + timedelta(minutes=i))
        self.client.get('/')
        self.assertEqual(Visitor.objects.count(), 100)
        self.assertEqual(Visitor.objects.order_by('date').first().date, start_time + timedelta(minutes=50))
        self.assertEqual(Visitor.objects.order_by('date').last().date, start_time + timedelta(minutes=149))
