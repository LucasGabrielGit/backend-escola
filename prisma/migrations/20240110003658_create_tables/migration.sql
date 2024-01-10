-- CreateTable
CREATE TABLE "PessoaFisica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "genero" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "numTelefone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "nacionalidade" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaFisicaId" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    CONSTRAINT "Aluno_pessoaFisicaId_fkey" FOREIGN KEY ("pessoaFisicaId") REFERENCES "PessoaFisica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pessoaFisicaId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "titulacao" TEXT NOT NULL,
    "areaEspecializacao" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL,
    CONSTRAINT "Professor_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Professor_pessoaFisicaId_fkey" FOREIGN KEY ("pessoaFisicaId") REFERENCES "PessoaFisica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ano" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "turno" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroMatricula" TEXT NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "dataMatricula" DATETIME NOT NULL,
    "status" INTEGER NOT NULL,
    "observacoes" TEXT NOT NULL,
    "statusMatriculaId" INTEGER NOT NULL,
    CONSTRAINT "Matricula_statusMatriculaId_fkey" FOREIGN KEY ("statusMatriculaId") REFERENCES "StatusMatricula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pendencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "alunoId" INTEGER NOT NULL,
    CONSTRAINT "Pendencia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusMatricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matriculaId" INTEGER NOT NULL,
    "nota1" DECIMAL NOT NULL,
    "nota2" DECIMAL NOT NULL,
    "nota3" DECIMAL NOT NULL,
    "nota4" DECIMAL NOT NULL,
    CONSTRAINT "Nota_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cargaHoraria" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PessoaFisica_id_key" ON "PessoaFisica"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PessoaFisica_cpf_key" ON "PessoaFisica"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "PessoaFisica_rg_key" ON "PessoaFisica"("rg");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_id_key" ON "Aluno"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_usuario_key" ON "Aluno"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_id_key" ON "Professor"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Turma_id_key" ON "Turma"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_id_key" ON "Matricula"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_numeroMatricula_key" ON "Matricula"("numeroMatricula");

-- CreateIndex
CREATE UNIQUE INDEX "Pendencia_id_key" ON "Pendencia"("id");

-- CreateIndex
CREATE UNIQUE INDEX "StatusMatricula_id_key" ON "StatusMatricula"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Nota_id_key" ON "Nota"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_id_key" ON "Disciplina"("id");
