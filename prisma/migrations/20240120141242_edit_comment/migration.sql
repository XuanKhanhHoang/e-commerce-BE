/*
  Warnings:

  - Added the required column `seller_reply` to the `comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `comment` ADD COLUMN `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `seller_reply` MEDIUMTEXT NOT NULL,
    MODIFY `rating` INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE `comment_image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image` VARCHAR(191) NOT NULL,
    `comment_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `comment_image` ADD CONSTRAINT `comment_image_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `comment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
