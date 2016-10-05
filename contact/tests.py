"""
Unit tests for the contact form.

Uses the django test mailbox to make sure emails are getting sent as expected.
"""

from django.test import TestCase
from django.core import mail
from django.core.urlresolvers import reverse

class ContactTests(TestCase):
    """Tests fo the contact form."""

    def test_contact_form_exists(self):
        """Check that the form has been placed on the page."""
        response = self.client.get(reverse('contact'))
        self.assertNotContains(response, 'class="warning"')
        self.assertContains(response, 'method="post"')

    def test_send_complete_message(self):
        """Check that the form sends an email."""
        response = self.client.post(reverse('send'),
                                    {'name': 'Bill',
                                     'email': 'bill@example.com',
                                     'message': 'Hi there'})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Web Feedback')
        self.assertEqual(mail.outbox[0].body, 'Hi there')
        self.assertEqual(mail.outbox[0].from_email, 'Bill<bill@example.com>')
        self.assertEqual(mail.outbox[0].to, ['contact@threepins.org'])
        self.assertIn('contact/sent.html', map(lambda t: t.name, response.templates))

    def test_send_anonymous_message(self):
        """Check that a placeholder is inserted if the sender doesn't provide a name."""
        response = self.client.post(reverse('send'),
                                    {'name': '',
                                     'email': '',
                                     'message': 'Hi there'})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, 'Web Feedback')
        self.assertEqual(mail.outbox[0].body, 'Hi there')
        self.assertEqual(mail.outbox[0].from_email, 'Anonymous<contact@threepins.org>')
        self.assertEqual(mail.outbox[0].to, ['contact@threepins.org'])
        self.assertIn('contact/sent.html', map(lambda t: t.name, response.templates))

    def test_reject_blank_message(self):
        """Check that the page shows an error if an empty message is submitted."""
        response = self.client.post(reverse('send'),
                                    {'name': 'Bill',
                                     'email': 'bill@example.com',
                                     'message': ''})
        self.assertEqual(len(mail.outbox), 0)
        self.assertIn('contact/contact.html', map(lambda t: t.name, response.templates))
        self.assertContains(response, 'Add a message')
