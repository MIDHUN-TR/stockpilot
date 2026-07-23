/*
  Warnings:

  - Changed the type of `referenceType` on the `stock_movements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "referenceType" AS ENUM ('RETAIL_BILL', 'ECOMMERCE_ORDER', 'PURCHASE_ORDER', 'OPENING_STOCK', 'MANUAL_ADJUSTMENT', 'INTERNAL_TRANSFER', 'WHOLESALE_BILL');

-- AlterTable
ALTER TABLE "stock_movements" DROP COLUMN "referenceType",
ADD COLUMN     "referenceType" "referenceType" NOT NULL;
