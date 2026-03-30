import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { sendContactMessage, subscribeToMailingList } from '../services/contact';

const ContactScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 1024;
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.content, { paddingHorizontal: isCompact ? 14 : 20 }, isWide && styles.contentWide]}>
      <Text style={[styles.title, { fontSize: isCompact ? 24 : isWide ? 34 : 30, marginBottom: isCompact ? 6 : 8 }]}>Contact The Museum</Text>
      <Text style={[styles.subtitle, { fontSize: isCompact ? 13 : 14, marginBottom: isCompact ? 12 : 16, lineHeight: isCompact ? 19 : 21 }]}>
        Questions, partnerships, or event inquiries? Send us a message and subscribe to our mailing list.
      </Text>

      {error ? <Text style={[styles.errorText, { fontSize: isCompact ? 12 : 13 }]}>{error}</Text> : null}
      {feedback ? <Text style={[styles.feedbackText, { fontSize: isCompact ? 12 : 13 }]}>{feedback}</Text> : null}

      <View style={[styles.formGrid, isWide && styles.formGridWide]}>
        <View style={[styles.card, styles.formCard, isWide && styles.formCardWide, { marginBottom: isWide ? 0 : (isCompact ? 12 : 14), padding: isCompact ? 14 : 16 }]}>
          <Text style={[styles.sectionTitle, { fontSize: isCompact ? 16 : 18, marginBottom: isCompact ? 10 : 10 }]}>Send a Message</Text>
          <TextInput
            style={[styles.input, { fontSize: isCompact ? 13 : 14, marginBottom: isCompact ? 10 : 10 }]}
            placeholder="Full name"
            value={form.name}
            onChangeText={(v) => updateForm('name', v)}
            accessibilityLabel="Contact full name input"
            accessibilityHint="Enter your full name"
          />
          <TextInput
            style={[styles.input, { fontSize: isCompact ? 13 : 14, marginBottom: isCompact ? 10 : 10 }]}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => updateForm('email', v)}
            accessibilityLabel="Contact email input"
            accessibilityHint="Enter your email address"
          />
          <TextInput
            style={[styles.input, { fontSize: isCompact ? 13 : 14, marginBottom: isCompact ? 10 : 10 }]}
            placeholder="Subject"
            value={form.subject}
            onChangeText={(v) => updateForm('subject', v)}
            accessibilityLabel="Subject input"
            accessibilityHint="Enter message subject"
          />
          <TextInput
            style={[styles.input, styles.messageInput, { fontSize: isCompact ? 13 : 14, minHeight: isCompact ? 100 : 110 }]}
            placeholder="Message"
            multiline
            value={form.message}
            onChangeText={(v) => updateForm('message', v)}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message here"
          />

          <Pressable
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1, paddingVertical: isCompact ? 11 : 13 }]}
            onPress={submitMessage}
            disabled={loadingMessage}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {loadingMessage ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { fontSize: isCompact ? 13 : 14 }]}>Send Message</Text>}
          </Pressable>
        </View>

        <View style={[styles.card, styles.formCard, isWide && styles.formCardWide, { padding: isCompact ? 14 : 16 }]}>
          <Text style={[styles.sectionTitle, { fontSize: isCompact ? 16 : 18, marginBottom: isCompact ? 10 : 10 }]}>Join Our Mailing List</Text>
          <TextInput
            style={[styles.input, { fontSize: isCompact ? 13 : 14, marginBottom: isCompact ? 10 : 10 }]}
            placeholder="Full name (optional)"
            value={newsletter.fullName}
            onChangeText={(v) => updateNewsletter('fullName', v)}
            accessibilityLabel="Newsletter full name input"
            accessibilityHint="Enter your name (optional)"
          />
          <TextInput
            style={[styles.input, { fontSize: isCompact ? 13 : 14, marginBottom: isCompact ? 12 : 14 }]}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={newsletter.email}
            onChangeText={(v) => updateNewsletter('email', v)}
            accessibilityLabel="Newsletter email input"
            accessibilityHint="Enter your email address to subscribe"
          />

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.85 : 1, paddingVertical: isCompact ? 11 : 13 }]}
            onPress={subscribe}
            disabled={loadingSubscribe}
            accessibilityRole="button"
            accessibilityLabel="Subscribe to mailing list"
          >
            {loadingSubscribe ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { fontSize: isCompact ? 13 : 14 }]}>Subscribe</Text>}
          </Pressable>
        </View>
      </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    width: '100%',
    alignItems: 'stretch',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 20,
    paddingBottom: 28,
  },
  contentWide: {
    maxWidth: 1000,
  },
  formGrid: {
    width: '100%',
  },
  formGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  formCard: {
    flex: 1,
  },
  formCardWide: {
    width: '49%',
    flex: 0,
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
