/*
  Warnings:

  - You are about to drop the `facebook` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `facebook` DROP FOREIGN KEY `facebook_user_id_fkey`;

-- DropTable
DROP TABLE `facebook`;

-- CreateTable
CREATE TABLE `user_facebook` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `facebookId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `user_facebook_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `user_email_key` ON `user`(`email`);

-- AddForeignKey
ALTER TABLE `user_facebook` ADD CONSTRAINT `user_facebook_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`facebook_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
