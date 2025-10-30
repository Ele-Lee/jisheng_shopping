CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  points INTEGER DEFAULT 0,
  duty_count INTEGER DEFAULT 0,
  phone VARCHAR(20),
  province VARCHAR(50),
  city VARCHAR(50),
  district VARCHAR(50),
  address TEXT,
  shipping_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category TEXT,
  brand TEXT,
  name TEXT NOT NULL,
  specification TEXT,
  package_quantity INTEGER DEFAULT 1,
  shipping_from TEXT,
  courier_name TEXT,
  shipping_restrictions TEXT,
  market_price TEXT,
  price INTEGER DEFAULT 100,
  jd_link TEXT,
  features TEXT,
  product_code TEXT,
  image TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_users_department_id ON users(department_id);

TRUNCATE TABLE departments CASCADE;
ALTER SEQUENCE departments_id_seq RESTART WITH 1;
