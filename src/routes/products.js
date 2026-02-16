import { Router } from 'express';
import { Product } from '../models/index.js';
import { getCurrentAdmin } from '../middleware/auth.js';
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

// Public: list visible products
router.get('/products', async (req, res) => {
  const list = await Product.findAll({
    where: { is_visible: true },
    order: [
      ['sort_order', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  res.json(list.map(productToRead));
});

// Admin: list all products
routerAdmin.get('/admin/products', getCurrentAdmin, async (req, res) => {
  const list = await Product.findAll({
    order: [
      ['sort_order', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  res.json(list.map(productToRead));
});

// Admin: create product
routerAdmin.post('/admin/products', getCurrentAdmin, async (req, res) => {
  const { title, slug, description, short_description, image_url, sort_order, is_visible } = req.body;
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

// Admin: get one product
routerAdmin.get('/admin/products/:product_id', getCurrentAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.product_id);
  if (!product) return res.status(404).json({ detail: 'Товар не найден' });
  res.json(productToRead(product));
});

// Admin: update product
routerAdmin.patch('/admin/products/:product_id', getCurrentAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.product_id);
  if (!product) return res.status(404).json({ detail: 'Товар не найден' });
  const { title, slug, description, short_description, image_url, sort_order, is_visible } = req.body;
  if (title !== undefined) product.title = String(title).trim();
  if (slug !== undefined) product.slug = slug ? String(slug).trim() : null;
  if (description !== undefined) product.description = String(description);
  if (short_description !== undefined) product.short_description = String(short_description).slice(0, 500);
  if (image_url !== undefined) product.image_url = String(image_url).slice(0, 512);
  if (sort_order !== undefined) product.sort_order = parseInt(sort_order, 10);
  if (is_visible !== undefined) product.is_visible = Boolean(is_visible);
  await product.save();
  res.json(productToRead(product));
});

// Admin: delete product
routerAdmin.delete('/admin/products/:product_id', getCurrentAdmin, async (req, res) => {
  const product = await Product.findByPk(req.params.product_id);
  if (!product) return res.status(404).json({ detail: 'Товар не найден' });
  await product.destroy();
  res.status(204).send();
});

// Admin: reorder products
routerAdmin.patch('/admin/products/reorder', getCurrentAdmin, async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  for (const { id, sort_order } of items) {
    if (id != null && sort_order != null) {
      await Product.update(
        { sort_order: parseInt(sort_order, 10) },
        { where: { id: parseInt(id, 10) } }
      );
    }
  }
  res.json({ ok: true });
});

export { router, routerAdmin };
