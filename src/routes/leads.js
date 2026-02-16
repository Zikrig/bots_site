const { Router } = require('express');
const { Lead, LeadStatus } = require('../models');
const { getCurrentAdmin } = require('../middleware/auth');
const { checkLeadRateLimit } = require('../middleware/rateLimit');

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

router.post('/leads', checkLeadRateLimit, async function (req, res) {
  const body = req.body;
  const phoneStr = body.phone != null ? String(body.phone).trim() : '';
  if (phoneStr.length < 10 || phoneStr.length > 20) {
    return res.status(400).json({ detail: 'Телефон должен быть от 10 до 20 символов' });
  }
  const lead = await Lead.create({
    phone: phoneStr,
    name: body.name ? String(body.name).trim().slice(0, 255) : null,
    comment: body.comment ? String(body.comment).trim().slice(0, 2000) : null,
  });
  res.status(201).json(leadToRead(lead));
});

routerAdmin.get('/admin/leads', getCurrentAdmin, async function (req, res) {
  const statusFilter = req.query.status;
  const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const statusValues = ['new', 'contacted', 'closed'];
  const where = statusFilter && statusValues.indexOf(statusFilter) !== -1
    ? { status: statusFilter }
    : {};
  const list = await Lead.findAll({
    where: where,
    order: [['created_at', 'DESC']],
    offset: skip,
    limit: limit,
  });
  res.json(list.map(leadToRead));
});

routerAdmin.patch('/admin/leads/:lead_id', getCurrentAdmin, async function (req, res) {
  const lead = await Lead.findByPk(req.params.lead_id);
  if (!lead) return res.status(404).json({ detail: 'Заявка не найдена' });
  const status = req.body.status;
  if (status && ['new', 'contacted', 'closed'].indexOf(status) !== -1) {
    lead.status = status;
    await lead.save();
  }
  res.json(leadToRead(lead));
});

exports.router = router;
exports.routerAdmin = routerAdmin;
