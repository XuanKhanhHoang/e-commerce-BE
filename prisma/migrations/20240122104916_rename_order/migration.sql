/*
  Warnings:

  - You are about to drop the `order` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `order_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `order_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_list_product` DROP FOREIGN KEY `order_list_product_order_id_fkey`;

-- DropTable
DROP TABLE `order`;

-- CreateTable
CREATE TABLE `orders_tbl` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status_id` INTEGER NOT NULL DEFAULT 1,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_list_product` ADD CONSTRAINT `order_list_product_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders_tbl`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders_tbl` ADD CONSTRAINT `orders_tbl_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `order_status`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders_tbl` ADD CONSTRAINT `orders_tbl_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
