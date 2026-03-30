import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { sendContactMessage, subscribeToMailingList } from '../services/contact';

const ContactScreen = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [newsletter, setNewsletter] = useState({ fullName: '', email: '' });
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingSubscribe, setLoadingSubscribe] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateNewsletter = (field, value) => setNewsletter((prev) => ({ ...prev, [field]: value }));

  const submitMessage = async () => {
    setError('');
    setFeedback('');
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please complete all contact fields.');
      return;
    }

    setLoadingMessage(true);
    try {
      const data = await sendContactMessage(form);
      setFeedback(data.message || 'Message sent successfully.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not send your message.');
    } finally {
      setLoadingMessage(false);
    }
  };

  const subscribe = async () => {
    setError('');
    setFeedback('');
    if (!newsletter.email) {
      setError('Email is required for newsletter subscription.');
      return;
    }

    setLoadingSubscribe(true);
    try {
      const data = await subscribeToMailingList(newsletter);
      setFeedback(data.message || 'Subscription completed.');
      setNewsletter((prev) => ({ ...prev, email: '' }));
    } catch (e) {
      setError(e.response?.data?.error || 'Could not complete subscription.');
    } finally {
      setLoadingSubscribe(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Contact The Museum</Text>
      <Text style={styles.subtitle}>
        Questions, partnerships, or event inquiries? Send us a message and subscribe to our mailing list.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Send a Message</Text>
        <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => updateForm('name', v)} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => updateForm('email', v)}
        />
        <TextInput style={styles.input} placeholder="Subject" value={form.subject} onChangeText={(v) => updateForm('subject', v)} />
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Message"
          multiline
          value={form.message}
          onChangeText={(v) => updateForm('message', v)}
        />

        <Pressable style={styles.button} onPress={submitMessage} disabled={loadingMessage}>
          {loadingMessage ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Message</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Join Our Mailing List</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name (optional)"
          value={newsletter.fullName}
          onChangeText={(v) => updateNewsletter('fullName', v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={newsletter.email}
          onChangeText={(v) => updateNewsletter('email', v)}
        />

        <Pressable style={styles.secondaryButton} onPress={subscribe} disabled={loadingSubscribe}>
          {loadingSubscribe ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Subscribe</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#faf8f4',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  messageInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#ff4c4c',
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#ff4c4c',
    marginBottom: 10,
    fontSize: 13,
  },
  feedbackText: {
    color: '#1a7f37',
    marginBottom: 10,
    fontSize: 13,
  },
});

export default ContactScreen;
