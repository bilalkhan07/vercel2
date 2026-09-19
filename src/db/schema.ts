import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const designers = pgTable('designers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  identifier: text('identifier'),
  password: text('password'),
  pin: text('pin'),
  portfolio: text('portfolio'),
  skills: text('skills'),
  status: text('status').default('Pending'),
  role: text('role').default('designer'),
  avatar: text('avatar'),
  avatarUrl: text('avatar_url'),
  date: text('date'),
  createdAt: timestamp('created_at').defaultNow()
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title'),
  service: text('service'),
  serviceId: text('service_id'),
  clientName: text('client_name'),
  clientPhone: text('client_phone'),
  clientEmail: text('client_email'),
  city: text('city'),
  price: integer('price').default(399),
  status: text('status').default('New'),
  completed: boolean('completed').default(false),
  completedAt: text('completed_at'),
  assignedDesignerId: text('assigned_designer_id'),
  assignedDesignerName: text('assigned_designer_name'),
  assignedDesignerPhone: text('assigned_designer_phone'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow()
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  endpoint: text('endpoint').notNull(),
  subscription: jsonb('subscription').notNull(),
  role: text('role').default('designer'),
  identifier: text('identifier'),
  name: text('name'),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const loginHistory = pgTable('login_history', {
  id: text('id').primaryKey(),
  phone: text('phone'),
  name: text('name'),
  role: text('role'),
  status: text('status'),
  timestamp: timestamp('timestamp').defaultNow()
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city'),
  rating: integer('rating').default(5),
  review: text('review').notNull(),
  service: text('service'),
  avatar: text('avatar'),
  date: text('date'),
  createdAt: timestamp('created_at').defaultNow()
});

export const cityAddresses = pgTable('city_addresses', {
  id: text('id').primaryKey(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow()
});
