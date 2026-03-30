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
