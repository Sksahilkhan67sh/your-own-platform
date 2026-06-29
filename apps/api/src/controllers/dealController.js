import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as dealService from '../services/dealService.js';

export const createDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.createDeal(req.body, req.user.id);
  sendSuccess(res, { statusCode: 201, data: deal });
});

export const listDeals = asyncHandler(async (req, res) => {
  const { items, meta } = await dealService.listDeals(req.query);
  sendSuccess(res, { data: items, meta });
});

export const getDealById = asyncHandler(async (req, res) => {
  const deal = await dealService.getDealById(req.params.id);
  sendSuccess(res, { data: deal });
});

export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await dealService.updateDeal(req.params.id, req.body);
  sendSuccess(res, { data: deal });
});

export const deleteDeal = asyncHandler(async (req, res) => {
  await dealService.deleteDeal(req.params.id);
  sendSuccess(res, { data: { deleted: true } });
});

export const getCommissionSummary = asyncHandler(async (req, res) => {
  const summary = await dealService.getCommissionSummary();
  sendSuccess(res, { data: summary });
});
