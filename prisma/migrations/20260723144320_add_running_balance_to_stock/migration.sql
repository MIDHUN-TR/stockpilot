/*
  Warnings:

  - Added the required column `quantityAfter` to the `stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantityBefore` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "quantityAfter" INTEGER NOT NULL,
ADD COLUMN     "quantityBefore" INTEGER NOT NULL;
