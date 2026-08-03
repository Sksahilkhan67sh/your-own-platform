import { Deal } from '../models/Deal.js';
import { Land } from '../models/Land.js';
import { ApiError } from '../utils/ApiError.js';
import { invalidateAnalyticsForLand } from './analytics/analyticsService.js';

const DEFAULT_COMMISSION_RATE = 2;

export async function createDeal(payload, createdByUserId) {
  const land = await Land.findById(payload.landId);
  if (!land) throw ApiError.notFound('Listing not found');

  const rate = payload.commissionRate ?? DEFAULT_COMMISSION_RATE;
  // Each party pays their own commission on the same final price — this is
  // not split, it's 2% from the buyer AND 2% from the seller separately.
  const commissionAmount = Math.round((payload.finalPrice * rate) / 100);

  const deal = await Deal.create({
    land: land._id,
    finalPrice: payload.finalPrice,
    buyerName: payload.buyerName,
    buyerContact: payload.buyerContact,
    sellerName: payload.sellerName,
    sellerContact: payload.sellerContact,
    commissionRate: rate,
    buyerCommissionAmount: commissionAmount,
    sellerCommissionAmount: commissionAmount,
    notes: payload.notes || '',
    createdBy: createdByUserId,
  });

  return populateDeal(deal._id);
}

export async function listDeals({ status, page, limit }) {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Deal.find(query)
      .populate('land', 'title slug city state')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Deal.countDocuments(query),
  ]);

  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getDealById(id) {
  const deal = await populateDeal(id);
  if (!deal) throw ApiError.notFound('Deal not found');
  return deal;
}

export async function updateDeal(id, payload) {
  const deal = await Deal.findById(id);
  if (!deal) throw ApiError.notFound('Deal not found');

  const statusChanged = payload.status !== undefined && payload.status !== deal.status;

  if (payload.status !== undefined) deal.status = payload.status;
  if (payload.notes !== undefined) deal.notes = payload.notes;

  await deal.save();

  if (statusChanged) {
    invalidateAnalyticsForLand(deal.land.toString());
  }

  return populateDeal(deal._id);
}

export async function deleteDeal(id) {
  const deal = await Deal.findById(id);
  if (!deal) throw ApiError.notFound('Deal not found');
  await deal.deleteOne();
}

export async function getCommissionSummary() {
  const [pending, paid] = await Promise.all([
    Deal.aggregate([
      { $match: { status: 'pending_payment' } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: { $add: ['$buyerCommissionAmount', '$sellerCommissionAmount'] } },
          dealCount: { $sum: 1 },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: { $add: ['$buyerCommissionAmount', '$sellerCommissionAmount'] } },
          dealCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    pending: { totalCommission: pending[0]?.totalCommission || 0, dealCount: pending[0]?.dealCount || 0 },
    paid: { totalCommission: paid[0]?.totalCommission || 0, dealCount: paid[0]?.dealCount || 0 },
  };
}

function populateDeal(id) {
  return Deal.findById(id).populate('land', 'title slug city state').lean();
}
