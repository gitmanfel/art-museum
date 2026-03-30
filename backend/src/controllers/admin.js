'use strict';

const crypto = require('crypto');
const userRepo = require('../db/userRepository');
const orderRepo = require('../db/orderRepository');
const catalogueRepo = require('../db/catalogueRepository');

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
  });
};

exports.getOrders = (req, res) => {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const orders = orderRepo.listOrders(limit);
  return res.status(200).json({ orders });
};

exports.getUsers = (req, res) => {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  const users = userRepo.listUsers(limit);
  return res.status(200).json({ users });
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

  return res.status(201).json({ collection });
};

exports.updateCollection = (req, res) => {
  const existing = catalogueRepo.getCollectionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Collection not found' });

  const collection = catalogueRepo.updateCollection(req.params.id, {
    name: req.body.name || existing.name,
    description: req.body.description ?? existing.description,
    category: req.body.category ?? existing.category,
    era_start: req.body.era_start !== undefined ? Number(req.body.era_start) : existing.era_start,
    era_end: req.body.era_end !== undefined ? Number(req.body.era_end) : existing.era_end,
    image_url: req.body.image_url ?? existing.image_url,
  });

  return res.status(200).json({ collection });
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

  return res.status(201).json({ exhibition });
};

exports.updateExhibition = (req, res) => {
  const existing = catalogueRepo.getExhibitionById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Exhibition not found' });

  const exhibition = catalogueRepo.updateExhibition(req.params.id, {
    name: req.body.name || existing.name,
    artist: req.body.artist ?? existing.artist,
    description: req.body.description ?? existing.description,
    start_date: req.body.start_date !== undefined ? Number(req.body.start_date) : existing.start_date,
    end_date: req.body.end_date !== undefined ? Number(req.body.end_date) : existing.end_date,
    location_floor: req.body.location_floor ?? existing.location_floor,
    image_url: req.body.image_url ?? existing.image_url,
  });

  return res.status(200).json({ exhibition });
};
