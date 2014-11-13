from django.shortcuts import render
from django.core.mail import send_mail

def contact(request):
    return render(request, 'contact/contact.html')

def send(request):
    if not request.POST['message']:
        return render(request, 'contact/contact.html', {'warning': 'Add a message before you hit Send!',})

    name = request.POST['name']
    if not name:
        name = 'Anonymous'

    email = request.POST['email']
    if not email:
        email = 'contact@threepins.org'

    send_mail('Web Feedback', request.POST['message'], name + '<' + email + '>', ['contact@threepins.org'])
    return render(request, 'contact/sent.html')
