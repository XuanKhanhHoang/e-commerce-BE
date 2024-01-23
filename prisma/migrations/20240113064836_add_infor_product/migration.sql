-- DropForeignKey
ALTER TABLE `product_options` DROP FOREIGN KEY `product_options_id_fkey`;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `create_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `update_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `product_options_product_id_fkey` ON `product_options`(`product_id`);

-- AddForeignKey
ALTER TABLE `product_options` ADD CONSTRAINT `product_options_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
