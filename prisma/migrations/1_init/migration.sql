-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum safely if it does not exist: Role
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('Admin', 'Manager', 'Staff');
    END IF;
END $$;
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'Admin';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'Manager';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'Staff';

-- CreateEnum safely if it does not exist: OrderStatus
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
        CREATE TYPE "OrderStatus" AS ENUM ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
    END IF;
END $$;
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Pending';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Processing';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Shipped';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Delivered';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Cancelled';

-- CreateEnum safely if it does not exist: PaymentStatus
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Success', 'Failed', 'Refunded');
    END IF;
END $$;
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'Pending';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'Success';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'Failed';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'Refunded';

-- CreateEnum safely if it does not exist: StockMovementType
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockMovementType') THEN
        CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
    END IF;
END $$;
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'IN';
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'OUT';
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT';

-- CreateEnum safely if it does not exist: StockReservationStatus
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockReservationStatus') THEN
        CREATE TYPE "StockReservationStatus" AS ENUM ('Active', 'Consumed', 'Released', 'Expired');
    END IF;
END $$;
ALTER TYPE "StockReservationStatus" ADD VALUE IF NOT EXISTS 'Active';
ALTER TYPE "StockReservationStatus" ADD VALUE IF NOT EXISTS 'Consumed';
ALTER TYPE "StockReservationStatus" ADD VALUE IF NOT EXISTS 'Released';
ALTER TYPE "StockReservationStatus" ADD VALUE IF NOT EXISTS 'Expired';

-- CreateEnum safely if it does not exist: ProductStatus
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
        CREATE TYPE "ProductStatus" AS ENUM ('Active', 'Draft', 'Discontinued', 'Archived');
    END IF;
END $$;
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'Active';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'Draft';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'Discontinued';
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'Archived';

-- CreateEnum safely if it does not exist: UserStatus
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive', 'Suspended');
    END IF;
END $$;
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'Active';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'Inactive';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'Suspended';

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Staff',
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "warehouses" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "inventory" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "stock_reservations" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'Active',
    "createdById" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "keywords" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "products" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'Draft',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentCategoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" INTEGER NOT NULL,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" INTEGER,
    "customerName" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "payments" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable safely if it does not exist
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);


-- CreateTable safely if it does not exist: _KeywordToProduct
CREATE TABLE IF NOT EXISTS "_KeywordToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_KeywordToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable safely if it does not exist: _ProductToTag
CREATE TABLE IF NOT EXISTS "_ProductToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductToTag_AB_pkey" PRIMARY KEY ("A","B")
);


-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "inventory_productId_idx" ON "inventory"("productId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "inventory_warehouseId_idx" ON "inventory"("warehouseId");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_warehouseId_productId_key" ON "inventory"("warehouseId", "productId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_reservations_productId_idx" ON "stock_reservations"("productId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_reservations_warehouseId_idx" ON "stock_reservations"("warehouseId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_reservations_orderId_idx" ON "stock_reservations"("orderId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_reservations_createdById_idx" ON "stock_reservations"("createdById");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_key" ON "tags"("name");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "keywords_name_key" ON "keywords"("name");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "product_images_productId_idx" ON "product_images"("productId");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "categories_parentCategoryId_idx" ON "categories"("parentCategoryId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "stock_movements_createdById_idx" ON "stock_movements"("createdById");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex safely if it does not exist
CREATE UNIQUE INDEX IF NOT EXISTS "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "_KeywordToProduct_B_index" ON "_KeywordToProduct"("B");

-- CreateIndex safely if it does not exist
CREATE INDEX IF NOT EXISTS "_ProductToTag_B_index" ON "_ProductToTag"("B");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeywordToProduct" ADD CONSTRAINT "_KeywordToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KeywordToProduct" ADD CONSTRAINT "_KeywordToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToTag" ADD CONSTRAINT "_ProductToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToTag" ADD CONSTRAINT "_ProductToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

