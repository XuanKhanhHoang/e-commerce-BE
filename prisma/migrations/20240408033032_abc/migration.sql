/*
  Warnings:

  - You are about to drop the column `infomation` on the `products` table. All the data in the column will be lost.
  - Added the required column `information` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders_tbl` ADD COLUMN `payment_method_id` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `infomation`,
    ADD COLUMN `information` LONGTEXT NOT NULL;

-- CreateTable
CREATE TABLE `payment_method` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders_tbl` ADD CONSTRAINT `orders_tbl_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_method`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
