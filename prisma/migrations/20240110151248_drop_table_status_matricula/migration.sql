/*
  Warnings:

  - You are about to drop the `StatusMatricula` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `statusMatriculaId` on the `Matricula` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "StatusMatricula_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StatusMatricula";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Matricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroMatricula" TEXT NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "dataMatricula" DATETIME NOT NULL,
    "status" INTEGER NOT NULL,
    "observacoes" TEXT NOT NULL,
    CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Matricula" ("alunoId", "dataMatricula", "id", "numeroMatricula", "observacoes", "status", "turmaId") SELECT "alunoId", "dataMatricula", "id", "numeroMatricula", "observacoes", "status", "turmaId" FROM "Matricula";
DROP TABLE "Matricula";
ALTER TABLE "new_Matricula" RENAME TO "Matricula";
CREATE UNIQUE INDEX "Matricula_id_key" ON "Matricula"("id");
CREATE UNIQUE INDEX "Matricula_numeroMatricula_key" ON "Matricula"("numeroMatricula");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
