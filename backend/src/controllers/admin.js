'use strict';

const crypto = require('crypto');
const userRepo = require('../db/userRepository');
const orderRepo = require('../db/orderRepository');
const catalogueRepo = require('../db/catalogueRepository');
const adminAuditRepo = require('../db/adminAuditRepository');
const contactRepo = require('../db/contactRepository');
const { getMetrics } = require('../services/monitoring');
const { sendMail } = require('../services/mailing');

exports.getOverview = (req, res) => {
  const userCounts = userRepo.getUserCounts();
  const orderMetrics = orderRepo.getOrderMetrics();
  const lowStockProducts = catalogueRepo.getLowStockProducts(5);
  const recentOrders = orderRepo.listOrders(10);

  return res.status(200).json({
    users: userCounts,
    orders: orderMetrics,
    lowStockProducts,
    recentOrders,
    runtimeMetrics: getMetrics(),
  });
};

exports.getOrders = (req, res) => {
  const result = orderRepo.listOrdersPaged({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
  });
  return res.status(200).json({ orders: result.rows, meta: result.meta });
};

exports.getUsers = (req, res) => {
  const result = userRepo.listUsersPaged({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
  });
  return res.status(200).json({ users: result.rows, meta: result.meta });
};

exports.getAuditLogs = (req, res) => {
  const result = adminAuditRepo.listAuditLogs({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
  });
  return res.status(200).json({ auditLogs: result.rows, meta: result.meta });
};

exports.getContactMessages = (req, res) => {
  const result = contactRepo.listMessagesPaged({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
  });
  return res.status(200).json({ messages: result.rows, meta: result.meta });
};

exports.getNewsletterSubscribers = (req, res) => {
  const result = contactRepo.listSubscribersPaged({
    page: req.query.page,
    pageSize: req.query.pageSize,
    search: req.query.search,
  });
  return res.status(200).json({ subscribers: result.rows, meta: result.meta });
};

exports.replyToContactMessage = async (req, res) => {
  const messageId = Number(req.params.id);
  if (!Number.isInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'Invalid message id' });
  }

  const message = contactRepo.getMessageById(messageId);
  if (!message) {
    return res.status(404).json({ error: 'Contact message not found' });
  }

  const subject = String(req.body.subject || '').trim();
  const body = String(req.body.body || '').trim();
  if (!subject || !body) {
    return res.status(400).json({ error: 'subject and body are required' });
  }

  const mail = await sendMail({
    to: message.email,
    subject,
    text: body,
    html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
  });

  if (!mail.delivered) {
    return res.status(502).json({ error: 'Could not send email reply' });
  }

  const updatedMessage = contactRepo.markMessageReplied({
    id: messageId,
    repliedBy: req.user.email || req.user.userId,
  });

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'contact.reply',
    entityType: 'contact_message',
    entityId: String(messageId),
    before: null,
    after: { to: message.email, subject },
  });

  return res.status(200).json({ sent: true, message: updatedMessage });
};

exports.createCollection = (req, res) => {
  const { name, description, category, era_start, era_end, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = req.body.id || `coll-${crypto.randomUUID()}`;
  const collection = catalogueRepo.createCollection({
    id,
    name,
    description: description || null,
    category: category || null,
    era_start: Number.isFinite(Number(era_start)) ? Number(era_start) : null,
    era_end: Number.isFinite(Number(era_end)) ? Number(era_end) : null,
    image_url: image_url || null,
  });

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'collection.create',
    entityType: 'collection',
    entityId: collection.id,
    after: collection,
  });

  return res.status(201).json({ collection });
};

exports.updateCollection = (req, res) => {
  const existing = catalogueRepo.getCollectionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Collection not found' });

  const expectedUpdatedAt = Number(req.body.expectedUpdatedAt);
  if (!Number.isFinite(expectedUpdatedAt)) {
    return res.status(400).json({ error: 'expectedUpdatedAt is required for optimistic locking' });
  }

  const collection = catalogueRepo.updateCollection(req.params.id, {
    name: req.body.name || existing.name,
    description: req.body.description ?? existing.description,
    category: req.body.category ?? existing.category,
    era_start: req.body.era_start !== undefined ? Number(req.body.era_start) : existing.era_start,
    era_end: req.body.era_end !== undefined ? Number(req.body.era_end) : existing.era_end,
    image_url: req.body.image_url ?? existing.image_url,
  }, expectedUpdatedAt);

  if (collection?.ok === false && collection.reason === 'conflict') {
    return res.status(409).json({ error: 'Conflict: collection changed by another admin' });
  }

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'collection.update',
    entityType: 'collection',
    entityId: req.params.id,
    before: existing,
    after: collection,
  });

  return res.status(200).json({ collection });
};

exports.deleteCollection = (req, res) => {
  const existing = catalogueRepo.getCollectionById(req.params.id);
  const deleted = catalogueRepo.deleteCollection(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Collection not found' });

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'collection.delete',
    entityType: 'collection',
    entityId: req.params.id,
    before: existing,
    after: null,
  });

  return res.status(200).json({ deleted: true });
};

exports.createExhibition = (req, res) => {
  const { name, artist, description, start_date, end_date, location_floor, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = req.body.id || `exh-${crypto.randomUUID()}`;
  const exhibition = catalogueRepo.createExhibition({
    id,
    name,
    artist: artist || null,
    description: description || null,
    start_date: Number.isFinite(Number(start_date)) ? Number(start_date) : null,
    end_date: Number.isFinite(Number(end_date)) ? Number(end_date) : null,
    location_floor: location_floor || null,
    image_url: image_url || null,
  });

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'exhibition.create',
    entityType: 'exhibition',
    entityId: exhibition.id,
    after: exhibition,
  });

  return res.status(201).json({ exhibition });
};

exports.updateExhibition = (req, res) => {
  const existing = catalogueRepo.getExhibitionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Exhibition not found' });

  const expectedUpdatedAt = Number(req.body.expectedUpdatedAt);
  if (!Number.isFinite(expectedUpdatedAt)) {
    return res.status(400).json({ error: 'expectedUpdatedAt is required for optimistic locking' });
  }

  const exhibition = catalogueRepo.updateExhibition(req.params.id, {
    name: req.body.name || existing.name,
    artist: req.body.artist ?? existing.artist,
    description: req.body.description ?? existing.description,
    start_date: req.body.start_date !== undefined ? Number(req.body.start_date) : existing.start_date,
    end_date: req.body.end_date !== undefined ? Number(req.body.end_date) : existing.end_date,
    location_floor: req.body.location_floor ?? existing.location_floor,
    image_url: req.body.image_url ?? existing.image_url,
  }, expectedUpdatedAt);

  if (exhibition?.ok === false && exhibition.reason === 'conflict') {
    return res.status(409).json({ error: 'Conflict: exhibition changed by another admin' });
  }

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'exhibition.update',
    entityType: 'exhibition',
    entityId: req.params.id,
    before: existing,
    after: exhibition,
  });

  return res.status(200).json({ exhibition });
};

exports.deleteExhibition = (req, res) => {
  const existing = catalogueRepo.getExhibitionById(req.params.id);
  const deleted = catalogueRepo.deleteExhibition(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Exhibition not found' });

  adminAuditRepo.logAction({
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    action: 'exhibition.delete',
    entityType: 'exhibition',
    entityId: req.params.id,
    before: existing,
    after: null,
  });

  return res.status(200).json({ deleted: true });
};
