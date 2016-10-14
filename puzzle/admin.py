"""
Admin views for loading and editing puzzles.

Puzzles and blank grids are viewed as whole units using inline
elements. Some extra fields are added to upload XML and ipuz files
instead of relying on manual data entry.
"""

import json
from xml.etree import ElementTree
from django.contrib import admin
from django.db.models import CharField
from django.forms import TextInput, FileField, ModelForm
from puzzle.models import Puzzle, Entry, Blank, Block

XMLNS = '{http://crossword.info/xml/rectangular-puzzle}'

def import_from_xml(xml, puzzle):
    """Load a puzzle from Crossword Compiler XML format into the database."""
    # pylint: disable=no-member
    # false +ve on xml.etree.ElementTree.Element (v1.64)
    crossword = ElementTree.parse(xml).find('*/%scrossword' % XMLNS)
    for word in crossword.iter('%sword' % XMLNS):
        xraw = word.attrib['x'].split('-')
        yraw = word.attrib['y'].split('-')
        xstart = int(xraw[0])
        ystart = int(yraw[0])
        down = len(yraw) > 1
        clue = crossword.find('*/%sclue[@word="%s"]' % (XMLNS, word.attrib['id'])).text
        if 'solution' in word.attrib:
            answer = word.attrib['solution']
        else:
            answer = ''
            if down:
                for y in range(ystart, int(yraw[1]) + 1):
                    answer += crossword.find('*/%scell[@x="%d"][@y="%d"]' %
                                             (XMLNS, xstart, y)).attrib['solution'].lower()
            else:
                for x in range(xstart, int(xraw[1]) + 1):
                    answer += crossword.find('*/%scell[@x="%d"][@y="%d"]' %
                                             (XMLNS, x, ystart)).attrib['solution'].lower()

        # XML is 1-based, model is 0-based
        xstart -= 1
        ystart -= 1
        entry = Entry(puzzle=puzzle, clue=clue, answer=answer, x=xstart, y=ystart, down=down)
        entry.save()

def import_blank_from_ipuz(ipuz, blank):
    """Load a blank grid from an ipuz file into the database."""
    data = json.loads(ipuz.read().decode('latin_1'))
    for y, row in enumerate(data['puzzle']):
        for x, cell in enumerate(row):
            if cell == "#":
                block = Block(blank=blank, x=x, y=y)
                block.save()

class PuzzleImportForm(ModelForm):
    """Add an XML import field."""
    file_import = FileField(label='Import from XML', required=False)
    class Meta:
        model = Puzzle
        fields = ['number', 'user', 'pub_date', 'comments']

class EntryInline(admin.StackedInline):
    """Increase the length of the text field for puzzle clues."""
    model = Entry
    formfield_overrides = {CharField: {'widget': TextInput(attrs={'size':'100'})}}

class PuzzleAdmin(admin.ModelAdmin):
    """Show entries inline and allow import from XML"""
    form = PuzzleImportForm
    inlines = [EntryInline]

    def save_model(self, request, obj, form, change):
        super(PuzzleAdmin, self).save_model(request, obj, form, change)
        xml_file = form.cleaned_data.get('file_import', None)
        if xml_file:
            import_from_xml(xml_file, obj)

class BlankImportForm(ModelForm):
    """Add an ipuz import field."""
    file_import = FileField(label='Import from ipuz', required=False)
    class Meta:
        model = Blank
        fields = ['display_order']

class BlockInline(admin.TabularInline):
    """Show blocks in a table."""
    model = Block

class BlankAdmin(admin.ModelAdmin):
    """Show blocks inline and allow import from ipuz."""
    form = BlankImportForm
    inlines = [BlockInline]
    save_as = True

    def save_model(self, request, obj, form, change):
        super(BlankAdmin, self).save_model(request, obj, form, change)
        ipuz_file = form.cleaned_data.get('file_import', None)
        if ipuz_file:
            import_blank_from_ipuz(ipuz_file, obj)

admin.site.site_header = "Three Pins Administration"
admin.site.site_title = "Three Pins"
admin.site.register(Puzzle, PuzzleAdmin)
admin.site.register(Blank, BlankAdmin)
