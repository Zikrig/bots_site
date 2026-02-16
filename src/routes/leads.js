import { Router } from 'express';
import { Lead, LeadStatus } from '../models/index.js';
import { getCurrentAdmin } from '../middleware/auth.js';
import { checkLeadRateLimit } from '../middleware/rateLimit.js';

const router = Router();
const routerAdmin = Router();

function leadToRead(l) {
  return {
    id: l.id,
    phone: l.phone,
    name: l.name,
    comment: l.comment,
    created_at: l.created_at ? l.created_at.toISOString() : '',
    status: l.status,
  };
}

// Public: create lead (with rate limit)
router.post('/leads', checkLeadRateLimit, async (req, res) => {
  const { phone, name, comment } = req.body;
  const phoneStr = phone != null ? String(phone).trim() : '';
  if (phoneStr.length < 10 || phoneStr.length > 20) {
    return res.status(400).json({ detail: 'Телефон должен быть от 10 до 20 символов' });
  }
  const lead = await Lead.create({
    phone: phoneStr,
    name: name ? String(name).trim().slice(0, 255) : null,
    comment: comment ? String(comment).trim().slice(0, 2000) : null,
  });
  res.status(201).json(leadToRead(lead));
});

// Admin: list leads (with optional status filter)
routerAdmin.get('/admin/leads', getCurrentAdmin, async (req, res) => {
  const statusFilter = req.query.status;
  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const where = statusFilter && Object.values(LeadStatus).includes(statusFilter)
    ? { status: statusFilter }
    : {};
  const list = await Lead.findAll({
    where,
    order: [['created_at', 'DESC']],
    offset: skip,
    limit,
  });
  res.json(list.map(leadToRead));
});

// Admin: update lead status
routerAdmin.patch('/admin/leads/:lead_id', getCurrentAdmin, async (req, res) => {
  const lead = await Lead.findByPk(req.params.lead_id);
  if (!lead) return res.status(404).json({ detail: 'Заявка не найдена' });
  const { status } = req.body;
  if (status && Object.values(LeadStatus).includes(status)) {
    lead.status = status;
    await lead.save();
  }
  res.json(leadToRead(lead));
});

export { router, routerAdmin };
