/*
  Warnings:

  - The primary key for the `embed` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `embed` table. The data in that column could be lost. The data in that column will be cast from `VarChar(19)` to `Int`.

*/
-- DropIndex
DROP INDEX `Embed_id_key` ON `embed`;

-- AlterTable
ALTER TABLE `embed` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);
