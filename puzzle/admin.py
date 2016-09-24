from django.contrib import admin
from django.db.models import CharField
from django.forms import TextInput, FileField, ModelForm
from xml.etree import ElementTree
from puzzle.models import Author, Puzzle, Entry, Blank, Block
import json

XMLNS = '{http://crossword.info/xml/rectangular-puzzle}'

def import_from_xml(xml, puzzle):
    crossword = ElementTree.parse(xml).find('*/%scrossword' % XMLNS)
    for word in crossword.iter('%sword' % XMLNS):
        xraw = word.attrib['x'].split('-')
        yraw = word.attrib['y'].split('-')
        x = int(xraw[0])
        y = int(yraw[0])
        down = len(yraw) > 1
        clue = crossword.find('*/%sclue[@word="%s"]' % (XMLNS, word.attrib['id'])).text
        if 'solution' in word.attrib:
            answer = word.attrib['solution']
        else:
            answer = ''
            if down:
                for cy in range(y, int(yraw[1]) + 1):
                    answer += crossword.find('*/%scell[@x="%d"][@y="%d"]' % (XMLNS, x, cy)).attrib['solution'].lower()
            else:
                for cx in range(x, int(xraw[1]) + 1):
                    answer += crossword.find('*/%scell[@x="%d"][@y="%d"]' % (XMLNS, cx, y)).attrib['solution'].lower()
        x -= 1; y-= 1 # XML is 1-based, model is 0-based
        entry = Entry(puzzle=puzzle, clue=clue, answer=answer, x=x, y=y, down=down)
        entry.save()

def import_blank_from_ipuz(ipuz, blank):
    data = json.loads(ipuz.read().decode('latin_1'))
    for y,row in enumerate(data['puzzle']):
        for x,cell in enumerate(row):
            if cell == "#":
                block = Block(blank=blank, x=x, y=y)
                block.save()

class PuzzleImportForm(ModelForm):
    file_import = FileField(label='Import from XML', required=False)
    class Meta:
        model = Puzzle
        fields = ['number', 'author', 'pub_date', 'comments']

class EntryInline(admin.StackedInline):
    model = Entry
    formfield_overrides = {CharField: {'widget': TextInput(attrs={'size':'100'})}}

class PuzzleAdmin(admin.ModelAdmin):
    form = PuzzleImportForm
    inlines = [EntryInline]

    def save_model(self, request, obj, form, change):
        super(PuzzleAdmin, self).save_model(request, obj, form, change)
        xml_file = form.cleaned_data.get('file_import', None)
        if xml_file:
            import_from_xml(xml_file, obj)

class BlankImportForm(ModelForm):
    file_import = FileField(label='Import from ipuz', required=False)
    class Meta:
        model = Blank
        fields = ['display_order']

class BlockInline(admin.TabularInline):
    model = Block

class BlankAdmin(admin.ModelAdmin):
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
admin.site.register(Author)
admin.site.register(Puzzle, PuzzleAdmin)
admin.site.register(Blank, BlankAdmin)
