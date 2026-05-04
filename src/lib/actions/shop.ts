'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';
import { rateLimit } from '@/lib/security/rate-limit';

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const PREMIUM_PLANS = ['premium'];

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || `product-${Date.now()}`
  );
}

async function ensurePremium() {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', userInfo.tenant_id)
    .single();
  if (!PREMIUM_PLANS.includes(tenant?.plan as string)) {
    return { error: 'ฟีเจอร์นี้รองรับเฉพาะแพลน Premium' };
  }
  return { supabase, tenantId: userInfo.tenant_id, userId: userInfo.id };
}

// ============================================================
// Product CRUD (admin)
// ============================================================

export async function listProducts() {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];
  const { data } = await supabase
    .from('products')
    .select('*, category:product_categories(id, name)')
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export interface ProductInput {
  id?: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  category_id?: string;
}

export async function saveProduct(input: ProductInput) {
  if (!input.name?.trim()) return { error: 'กรุณากรอกชื่อสินค้า' };
  if (input.price <= 0) return { error: 'ราคาต้องมากกว่า 0' };
  const ctx = await ensurePremium();
  if ('error' in ctx) return ctx;

  if (input.id) {
    const { error } = await ctx.supabase
      .from('products')
      .update({
        name: input.name.trim(),
        description: input.description ?? null,
        sku: input.sku ?? null,
        price: input.price,
        compare_at_price: input.compare_at_price ?? null,
        cost_price: input.cost_price ?? null,
        stock_quantity: input.stock_quantity ?? 0,
        images: input.images ?? [],
        is_active: input.is_active ?? true,
        is_featured: input.is_featured ?? false,
        category_id: input.category_id ?? null,
      })
      .eq('id', input.id)
      .eq('tenant_id', ctx.tenantId);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/shop-manage');
    return { success: true };
  }

  // New product — generate slug
  let slug = slugify(input.name);
  const { data: existing } = await ctx.supabase
    .from('products')
    .select('id')
    .eq('tenant_id', ctx.tenantId)
    .eq('slug', slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const { data, error } = await ctx.supabase
    .from('products')
    .insert({
      tenant_id: ctx.tenantId,
      name: input.name.trim(),
      slug,
      description: input.description ?? null,
      sku: input.sku ?? null,
      price: input.price,
      compare_at_price: input.compare_at_price ?? null,
      cost_price: input.cost_price ?? null,
      stock_quantity: input.stock_quantity ?? 0,
      images: input.images ?? [],
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      category_id: input.category_id ?? null,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/dashboard/shop-manage');
  return { success: true, product: data };
}

export async function deleteProduct(id: string) {
  const ctx = await ensurePremium();
  if ('error' in ctx) return ctx;
  const { error } = await ctx.supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/shop-manage');
  return { success: true };
}

// ============================================================
// Public storefront (no auth)
// ============================================================

export async function getPublicShop(tenantSlug: string) {
  const supabase = service();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, subscription_status, settings')
    .eq('slug', tenantSlug)
    .maybeSingle();
  if (!tenant || !PREMIUM_PLANS.includes(tenant.plan as string)) return null;
  if (tenant.subscription_status === 'cancelled') return null;
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, price, compare_at_price, images, is_featured, stock_quantity')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  return {
    tenant: {
      id: tenant.id as string,
      name: tenant.name as string,
      slug: tenant.slug as string,
      promptpay_id: ((tenant.settings as Record<string, unknown>)?.promptpay_id as string) || null,
      bank_account: (tenant.settings as Record<string, unknown>)?.bank_account ?? null,
    },
    products: products || [],
  };
}

export async function getPublicProduct(tenantSlug: string, productSlug: string) {
  const supabase = service();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, subscription_status')
    .eq('slug', tenantSlug)
    .maybeSingle();
  if (!tenant || !PREMIUM_PLANS.includes(tenant.plan as string)) return null;
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle();
  if (!product) return null;
  return {
    tenant: { id: tenant.id as string, name: tenant.name as string, slug: tenant.slug as string },
    product,
  };
}

// ============================================================
// Public order creation
// ============================================================

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface PublicOrderInput {
  tenantSlug: string;
  items: CartItemInput[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  paymentMethod: 'transfer' | 'promptpay' | 'cash_on_delivery';
  notes?: string;
}

export async function createPublicOrder(input: PublicOrderInput) {
  if (!input.customerName?.trim()) return { error: 'กรุณากรอกชื่อ' };
  if (!input.customerPhone?.trim()) return { error: 'กรุณากรอกเบอร์โทร' };
  if (!input.items || input.items.length === 0) return { error: 'ตะกร้าสินค้าว่าง' };

  // Per-phone rate limit: 10 orders per hour
  const rl = await rateLimit(
    'shop_order:phone',
    `${input.tenantSlug}:${input.customerPhone}`,
    10,
    '1h',
  );
  if (!rl.ok) {
    return { error: `สั่งซื้อบ่อยเกินไป กรุณาลองใหม่ในอีก ${rl.retryAfter ?? 60} วินาที` };
  }

  const supabase = service();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, plan, subscription_status')
    .eq('slug', input.tenantSlug)
    .maybeSingle();
  if (!tenant) return { error: 'ไม่พบร้านค้า' };
  if (!PREMIUM_PLANS.includes(tenant.plan as string)) return { error: 'ร้านนี้ไม่รองรับ shop' };
  if (tenant.subscription_status === 'cancelled') return { error: 'ร้านปิดให้บริการชั่วคราว' };

  // Fetch products + verify stock + compute totals
  const productIds = input.items.map((i) => i.productId);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, stock_quantity, is_active')
    .eq('tenant_id', tenant.id)
    .in('id', productIds);
  if (!products) return { error: 'ไม่พบสินค้า' };

  let subtotal = 0;
  const orderItems: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }> = [];
  for (const it of input.items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) return { error: 'ไม่พบสินค้าในตะกร้า' };
    if (!p.is_active) return { error: `สินค้า "${p.name}" หยุดขายแล้ว` };
    if (Number(p.stock_quantity) < it.quantity) {
      return { error: `สินค้า "${p.name}" มีสต็อกไม่พอ (เหลือ ${p.stock_quantity})` };
    }
    const unit = Number(p.price);
    const total = unit * it.quantity;
    subtotal += total;
    orderItems.push({
      product_id: p.id as string,
      name: p.name as string,
      quantity: it.quantity,
      unit_price: unit,
      total,
    });
  }

  // Find or create customer (by phone) — no auth required
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('phone', input.customerPhone)
    .maybeSingle();
  let customerId = existingCustomer?.id as string | undefined;
  if (!customerId) {
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenant.id,
        type: 'individual',
        name: input.customerName.trim(),
        phone: input.customerPhone.trim(),
        email: input.customerEmail?.trim() || null,
      })
      .select('id')
      .single();
    if (error || !newCustomer) return { error: 'สร้างข้อมูลลูกค้าไม่สำเร็จ' };
    customerId = newCustomer.id as string;
  }

  // Order number
  const ym = new Date().toISOString().slice(0, 7).replace('-', '');
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .like('order_number', `ORD-${ym}-%`);
  const seq = String((count || 0) + 1).padStart(4, '0');
  const orderNumber = `ORD-${ym}-${seq}`;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenant.id,
      customer_id: customerId,
      order_number: orderNumber,
      status: 'pending',
      items: orderItems,
      subtotal,
      total: subtotal,
      payment_method: input.paymentMethod === 'cash_on_delivery' ? null : input.paymentMethod,
      payment_status: 'pending',
      shipping_address: input.shippingAddress
        ? { full_address: input.shippingAddress }
        : null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();
  if (orderErr || !order) return { error: orderErr?.message || 'สร้างออเดอร์ไม่สำเร็จ' };

  // order_items rows
  await supabase.from('order_items').insert(
    orderItems.map((it) => ({
      order_id: order.id as string,
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total: it.total,
    })),
  );

  // Decrement stock (best effort — race condition possible under heavy
  // concurrent load; acceptable for MVP since checkout volume is low
  // and any oversell will surface during fulfillment).
  for (const it of orderItems) {
    const { data: cur } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', it.product_id)
      .single();
    if (cur) {
      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, Number(cur.stock_quantity) - it.quantity) })
        .eq('id', it.product_id);
    }
  }

  return {
    success: true,
    orderId: order.id as string,
    orderNumber: order.order_number as string,
  };
}

// Public order lookup by order number (for tracking)
export async function getPublicOrder(orderNumber: string) {
  const supabase = service();
  const { data } = await supabase
    .from('orders')
    .select(
      `
      *,
      tenant:tenants(name, slug, settings),
      customer:customers(name, phone, email)
    `,
    )
    .eq('order_number', orderNumber)
    .maybeSingle();
  return data;
}

// Customer marks slip uploaded
export async function attachOrderSlip(orderNumber: string, slipUrl: string) {
  const supabase = service();
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_status')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!order) return { error: 'ไม่พบออเดอร์' };
  if (order.payment_status === 'paid') return { error: 'ออเดอร์นี้ชำระแล้ว' };

  await supabase
    .from('orders')
    .update({
      notes: `[slip] ${slipUrl}`,
      payment_status: 'partial',
    })
    .eq('id', order.id);
  return { success: true };
}

// ============================================================
// Staff order management
// ============================================================

export async function listOrders(filter?: { status?: string }) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];
  let q = supabase
    .from('orders')
    .select('*, customer:customers(name, phone)')
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (filter?.status) q = q.eq('status', filter.status);
  const { data } = await q;
  return data || [];
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  const updates: Record<string, unknown> = { status };
  if (status === 'delivered' || status === 'shipped') {
    updates.payment_status = 'paid';
  }
  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .eq('tenant_id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/shop-manage/orders');
  return { success: true };
}
