/*
  Warnings:

  - You are about to alter the column `is_deleted` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Int` to `TinyInt`.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `is_deleted` BOOLEAN NOT NULL DEFAULT true;
