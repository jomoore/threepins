from django.test import TestCase
from django.core import mail
from django.core.urlresolvers import reverse

class ContactTests(TestCase):
    def test_contact_form_exists(self):
        response = self.client.get(reverse('contact'))
        self.assertNotContains(response, 'class="warning"')
        self.assertContains(response, 'method="post"')

    def test_send_complete_message(self):
        response = self.client.post(reverse('send'), {'name': 'Bill', 'email': 'bill@example.com', 'message': 'Hi there'})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Web Feedback')
        self.assertEqual(mail.outbox[0].body, 'Hi there')
        self.assertEqual(mail.outbox[0].from_email, 'Bill<bill@example.com>')
        self.assertEqual(mail.outbox[0].to, ['contact@threepins.org'])
        self.assertIn('contact/sent.html', map(lambda t: t.name, response.templates))

    def test_send_anonymous_message(self):
        response = self.client.post(reverse('send'), {'name': '', 'email': '', 'message': 'Hi there'})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Web Feedback')
        self.assertEqual(mail.outbox[0].body, 'Hi there')
        self.assertEqual(mail.outbox[0].from_email, 'Anonymous<contact@threepins.org>')
        self.assertEqual(mail.outbox[0].to, ['contact@threepins.org'])
        self.assertIn('contact/sent.html', map(lambda t: t.name, response.templates))

    def test_reject_blank_message(self):
        response = self.client.post(reverse('send'), {'name': 'Bill', 'email': 'bill@example.com', 'message': ''})
        self.assertEqual(len(mail.outbox), 0)
        self.assertIn('contact/contact.html', map(lambda t: t.name, response.templates))
        self.assertContains(response, 'Add a message')
