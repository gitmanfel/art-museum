'use strict';

const catalogueRepo = require('../db/catalogueRepository');

exports.getTicketTypes = (req, res) => {
  const types = catalogueRepo.getAllTicketTypes();
  return res.status(200).json({ ticketTypes: types });
};

exports.getMembershipTiers = (req, res) => {
  const tiers = catalogueRepo.getAllMembershipTiers();
  return res.status(200).json({ membershipTiers: tiers });
};

exports.getProducts = (req, res) => {
  const products = catalogueRepo.getAllProducts();
  return res.status(200).json({ products });
};

exports.getProduct = (req, res) => {
  const product = catalogueRepo.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.status(200).json({ product });
};

exports.getExhibitions = (req, res) => {
  const filters = {
    search: req.query.search,
    artist: req.query.artist,
    start_date: req.query.start_date ? parseInt(req.query.start_date) : undefined,
    end_date: req.query.end_date ? parseInt(req.query.end_date) : undefined,
    page: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20,
  };
  const result = catalogueRepo.getExhibitions(filters);
  return res.status(200).json({ exhibitions: result.rows, meta: result.meta });
};

exports.getExhibition = (req, res) => {
  const exhibition = catalogueRepo.getExhibitionById(req.params.id);
  if (!exhibition) return res.status(404).json({ error: 'Exhibition not found' });
  return res.status(200).json({ exhibition });
};

exports.getCollections = (req, res) => {
  const filters = {
    search: req.query.search,
    category: req.query.category,
    era_start: req.query.era_start ? parseInt(req.query.era_start) : undefined,
    era_end: req.query.era_end ? parseInt(req.query.era_end) : undefined,
    page: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20,
  };
  const result = catalogueRepo.getCollections(filters);
  return res.status(200).json({ collections: result.rows, meta: result.meta });
};

exports.getCollection = (req, res) => {
  const collection = catalogueRepo.getCollectionById(req.params.id);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });
  return res.status(200).json({ collection });
};

exports.updateProductInventory = (req, res) => {
  const stockQuantity = Number(req.body.stockQuantity);
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({ error: 'stockQuantity must be a non-negative integer' });
  }

  const existing = catalogueRepo.getProductById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const product = catalogueRepo.updateProductStock(req.params.id, stockQuantity);
  return res.status(200).json({ product });
};
