# API 文档

## 目录结构

```
my-app/
├── app/
│   ├── api/
│   │   ├── products/
│   │   │   └── route.ts          # 商品列表接口
│   │   ├── cart/
│   │   │   └── route.ts          # 购物车接口
│   │   └── users/
│   │       └── points/
│   │           └── route.ts      # 用户积分接口
│   ├── login/
│   │   └── page.tsx              # 登录页面
│   ├── list/
│   │   └── page.tsx              # 商品列表页面
│   └── cart/
│       └── page.tsx              # 购物车页面
├── lib/
│   └── db.ts                     # 数据库连接配置
├── types/
│   └── index.ts                  # TypeScript 类型定义
├── db/
│   └── schema.sql                # 数据库表结构
└── .env.local                    # 环境变量配置
```

## 数据库配置

1. 配置 `.env.local` 文件:
```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

2. 初始化数据库:
```bash
psql -U username -d dbname -f db/schema.sql
```

## API 接口

### 1. 商品列表

#### GET /api/products
获取所有商品列表

**响应示例:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "商品 1",
      "description": "这是商品 1 的描述",
      "price": 99.00,
      "image_url": "https://via.placeholder.com/150",
      "stock": 100
    }
  ]
}
```

---

### 2. 购物车管理

#### GET /api/cart?userId={userId}
获取用户购物车

**查询参数:**
- `userId` (必填): 用户ID

**响应示例:**
```json
{
  "cartItems": [
    {
      "id": 1,
      "user_id": 1,
      "product_id": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "name": "商品 1",
        "price": 99.00,
        "image_url": "https://via.placeholder.com/150"
      }
    }
  ]
}
```

#### POST /api/cart
添加商品到购物车

**请求体:**
```json
{
  "userId": 1,
  "productId": 1,
  "quantity": 1
}
```

**响应示例:**
```json
{
  "cartItem": {
    "id": 1,
    "user_id": 1,
    "product_id": 1,
    "quantity": 1
  }
}
```

#### PUT /api/cart
更新购物车商品数量

**请求体:**
```json
{
  "cartItemId": 1,
  "quantity": 3
}
```

**响应示例:**
```json
{
  "cartItem": {
    "id": 1,
    "user_id": 1,
    "product_id": 1,
    "quantity": 3
  }
}
```

#### DELETE /api/cart?cartItemId={cartItemId}
删除购物车商品

**查询参数:**
- `cartItemId` (必填): 购物车项ID

**响应示例:**
```json
{
  "message": "Item removed from cart"
}
```

---

### 3. 用户积分管理

#### GET /api/users/points?userId={userId}
获取用户积分

**查询参数:**
- `userId` (必填): 用户ID

**响应示例:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "points": 1000
  }
}
```

#### PUT /api/users/points
设置用户积分（绝对值）

**请求体:**
```json
{
  "userId": 1,
  "points": 1500
}
```

**响应示例:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "points": 1500
  }
}
```

#### PATCH /api/users/points
增减用户积分（相对值）

**请求体:**
```json
{
  "userId": 1,
  "pointsDelta": 100
}
```

**说明:**
- `pointsDelta` 为正数时增加积分
- `pointsDelta` 为负数时减少积分

**响应示例:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "points": 1600
  }
}
```

## 数据库表结构

### users 表
- `id`: 用户ID (主键)
- `username`: 用户名 (唯一)
- `password`: 密码
- `points`: 积分
- `created_at`: 创建时间
- `updated_at`: 更新时间

### products 表
- `id`: 商品ID (主键)
- `name`: 商品名称
- `description`: 商品描述
- `price`: 价格
- `image_url`: 图片URL
- `stock`: 库存
- `created_at`: 创建时间
- `updated_at`: 更新时间

### cart_items 表
- `id`: 购物车项ID (主键)
- `user_id`: 用户ID (外键)
- `product_id`: 商品ID (外键)
- `quantity`: 数量
- `created_at`: 创建时间
- `updated_at`: 更新时间
