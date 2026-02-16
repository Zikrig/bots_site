const { Router } = require('express');
const { Product } = require('../models');
const { getCurrentAdmin } = require('../middleware/auth');

const router = Router();
const routerAdmin = Router();

function productToRead(p) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description || '',
    short_description: p.short_description || '',
    image_url: p.image_url || '',
    sort_order: p.sort_order,
    is_visible: p.is_visible,
    created_at: p.created_at ? p.created_at.toISOString() : '',
    updated_at: p.updated_at ? p.updated_at.toISOString() : '',
  };
}

router.get('/products', async function (req, res) {
  const list = await Product.findAll({
    where: { is_visible: true },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
  });
  res.json(list.map(productToRead));
});

routerAdmin.get('/admin/products', getCurrentAdmin, async function (req, res) {
  const list = await Product.findAll({
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
  });
  res.json(list.map(productToRead));
});

routerAdmin.post('/admin/products', getCurrentAdmin, async function (req, res) {
  const body = req.body;
  const title = body.title;
  const slug = body.slug;
  const description = body.description;
  const short_description = body.short_description;
  const image_url = body.image_url;
  const sort_order = body.sort_order;
  const is_visible = body.is_visible;
  if (!title || String(title).trim().length === 0) {
    return res.status(400).json({ detail: 'Название обязательно' });
  }
  const product = await Product.create({
    title: String(title).trim(),
    slug: slug ? String(slug).trim() : null,
    description: description != null ? String(description) : '',
    short_description: short_description != null ? String(short_description).slice(0, 500) : '',
    image_url: image_url != null ? String(image_url).slice(0, 512) : '',
    sort_order: sort_order != null ? parseInt(sort_order, 10) : 0,
    is_visible: is_visible !== false,
  });
  res.status(201).json(productToRead(product));
});

routerAdmin.get('/admin/products/:product_id', getCurrentAdmin, async function (req, res) {
  const product = await Product.findByPk(req.params.product_id);
  if (!product) return res.status(404).json({ detail: 'Товар не найден' });
  res.json(productToRead(product));
});

routerAdmin.patch('/admin/products/:product_id', getCurrentAdmin, async function (req, res) {
  const product = await Product.findByPk(req.params.product_id);
  if (!product) return res.status(404).json({ detail: 'Товар не найден' });
  const body = req.body;
  if (body.title !== undefined) product.title = String(body.title).trim();
  if (body.slug !== undefined) product.slug = body.slug ? String(body.slug).trim() : null;
  if (body.description !== undefined) product.description = String(body.description);
  if (body.short_description !== undefined) product.short_description = String(body.short_description).slice(0, 500);
  if (body.image_url !== undefined) product.image_url = String(body.image_url).slice(0, 512);
  if (body.sort_order !== undefined) product.sort_order = parseInt(body.sort_order, 10);
  if (body.is_visible !== undefined) product.is_visible = Boolean(body.is_visible);
  await product.save();
  res.json(productToRead(product));
});

routerAdmin.delete('/admin/products/:product_id', getCurrentAdmin, async function (req, res) {
  const product = await Product.findByPk(req.params.product_id);
  if (!product) return res.status(404).json({ detail: 'Товар не найден' });
  await product.destroy();
  res.status(204).send();
});

routerAdmin.patch('/admin/products/reorder', getCurrentAdmin, async function (req, res) {
  const items = Array.isArray(req.body) ? req.body : [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = item.id;
    const sort_order = item.sort_order;
    if (id != null && sort_order != null) {
      await Product.update(
        { sort_order: parseInt(sort_order, 10) },
        { where: { id: parseInt(id, 10) } }
      );
    }
  }
  res.json({ ok: true });
});

exports.router = router;
exports.routerAdmin = routerAdmin;
