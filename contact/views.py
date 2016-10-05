"""
Functions to render and handle the contact form.
"""

from smtplib import SMTPRecipientsRefused
from django.shortcuts import render
from django.core.mail import send_mail

def contact(request):
    """Render the contact form as is."""
    return render(request, 'contact/contact.html')

def send(request):
    """Process POST of the contact form by sending an email to the site admin."""
    context = {'name': request.POST['name'], 'email': request.POST['email'],
               'message': request.POST['message'],}

    if not context['message']:
        context['warning'] = 'Add a message before you hit Send!'
        return render(request, 'contact/contact.html', context)

    if not context['name']:
        context['name'] = 'Anonymous'

    if not context['email']:
        context['email'] = 'contact@threepins.org'

    try:
        send_mail('Web Feedback', context['message'],
                  context['name'] + '<' + context['email'] + '>',
                  ['contact@threepins.org'])
    except SMTPRecipientsRefused:
        context['warning'] = "Couldn't make sense of that email address" \
                             "(but leave it blank if you like)."
        return render(request, 'contact/contact.html', context)

    return render(request, 'contact/sent.html')
