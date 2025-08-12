"""
Functions to render and handle the contact form.
"""

import os
from smtplib import SMTPRecipientsRefused
from django import forms
from django.shortcuts import render
from django.core.mail import send_mail

CONTACT_ADDRESS = os.environ.get('CONTACT_ADDRESS')

class ContactForm(forms.Form):
    """Contact form to send an email to the site admin."""
    name = forms.CharField(max_length=100, required=False)
    email = forms.CharField(max_length=254, required=False)
    message = forms.CharField(widget=forms.Textarea(attrs={'rows': 20, 'cols': 20}))

def contact(request):
    """Render the contact form."""
    context = {}
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name'] or 'Anonymous'
            email = form.cleaned_data['email'] or CONTACT_ADDRESS
            message = form.cleaned_data['message']
            try:
                send_mail('Web Feedback', message, name + '<' + email  + '>', [CONTACT_ADDRESS])
                return render(request, 'contact/sent.html')
            except SMTPRecipientsRefused:
                context['warning'] = "Couldn't make sense of that email address" \
                                     "(but leave it blank if you like)."
    else:
        form = ContactForm()

    context['form'] = form
    return render(request, 'contact/contact.html', context)
