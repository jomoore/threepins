from django.shortcuts import render
from django.core.mail import send_mail
from smtplib import SMTPRecipientsRefused

def contact(request):
    return render(request, 'contact/contact.html')

def send(request):
    context = { 'name': request.POST['name'], 'email': request.POST['email'], 'message': request.POST['message'], }

    if not context['message']:
        context['warning'] = 'Add a message before you hit Send!'
        return render(request, 'contact/contact.html', context)

    if not context['name']:
        context['name'] = 'Anonymous'

    if not context['email']:
        context['email'] = 'contact@threepins.org'

    try:
        send_mail('Web Feedback', context['message'], context['name'] + '<' + context['email'] + '>', ['contact@threepins.org'])
    except SMTPRecipientsRefused:
        context['warning'] = "Couldn't make sense of that email address (but leave it blank if you like)."
        return render(request, 'contact/contact.html', context)

    return render(request, 'contact/sent.html')
