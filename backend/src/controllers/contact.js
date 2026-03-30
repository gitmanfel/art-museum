'use strict';

const contactRepo = require('../db/contactRepository');
const { sendMail } = require('../services/mailing');

const MUSEUM_CONTACT_EMAIL = process.env.MUSEUM_CONTACT_EMAIL || 'contact@artmuseum.local';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

exports.submitContactMessage = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'name, email, subject, and message are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const saved = contactRepo.createMessage({ name, email, subject, message });

  await sendMail({
    to: MUSEUM_CONTACT_EMAIL,
    subject: `[Museum Contact] ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, '<br/>')}</p>`,
  });

  return res.status(201).json({
    message: 'Your message has been received. We will reply by email soon.',
    ticketId: saved.id,
  });
};

exports.subscribeNewsletter = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const fullName = req.body.fullName ? String(req.body.fullName).trim() : null;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const subscriber = contactRepo.upsertSubscriber({ email, fullName });

  await sendMail({
    to: email,
    subject: 'Welcome to The Art Museum mailing list',
    text: 'You are now subscribed to museum updates, events, and exhibitions.',
    html: '<p>You are now subscribed to museum updates, events, and exhibitions.</p>',
  });

  return res.status(200).json({
    message: 'Subscription confirmed. Welcome to our mailing list!',
    subscriber: {
      email: subscriber.email,
      fullName: subscriber.full_name,
      isActive: Boolean(subscriber.is_active),
    },
  });
};
