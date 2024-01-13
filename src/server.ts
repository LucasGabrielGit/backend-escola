import fastifyCors from '@fastify/cors'
import 'dotenv/config'
import { fastify } from 'fastify'
import { AlunoControllers } from './controllers/Aluno/AlunoControllers'
import { ProfessorController } from './controllers/Professor/ProfessorControllers'
import { DisciplinaController } from './controllers/Disciplina/DisciplinaControllers'
import { TurmaController } from './controllers/Turma/TurmaControllers'
import { MatriculaController } from './controllers/Matricula/MatriculaControllers'

const app = fastify()

app.register(fastifyCors)
const alunoController = new AlunoControllers()
const professorController = new ProfessorController()
const disciplinaController = new DisciplinaController()

const turmaController = new TurmaController()

// Rotas de aluno
app.post('/aluno/salvar', alunoController.salvar)
app.get('/aluno/listar', alunoController.listar)
app.post('/aluno/salvarPendencia/:id', alunoController.adicionarPendencia)
app.delete('/aluno/deletarAluno/:id', alunoController.deletarAluno)
app.post('/aluno/buscar', alunoController.buscarPorNumeroMatriculaOuNome)
app.patch('/aluno/atualizar/:id', alunoController.atualizarAluno)

// Rotas de Professor
app.post('/professor/salvar', professorController.salvar)
app.get('/professor/listar', professorController.listar)
app.patch('/professor/atualizar/:id', professorController.atualizar)

// Rotas de Disciplina
app.post('/disciplina/salvar', disciplinaController.salvar)
app.get('/disciplina/listar', disciplinaController.listar)
app.delete('/disciplina/deletar/:id', disciplinaController.deletar)

// Rotas de turma
app.post('/turma/salvar', turmaController.salvar)
app.get('/turma/listar', turmaController.listar)
app.delete('/turma/deletar/:id', turmaController.deletar)
app.post('/turma/buscar', turmaController.buscarPorNome)
app.put('/turma/atualizar/:id', turmaController.atualizarTurma)

// Rotas de matricula
app.post('/matricula/salvar', new MatriculaController().salvar)
app.post('/matricula/salvarNotas', new MatriculaController().salvarNotas)
app.get('/matricula/listar', new MatriculaController().listar)
app.post(
  '/matricula/buscar',
  new MatriculaController().buscarPorMatriculaOuNome
)
app.get('/matricula/detalhe/:id', new MatriculaController().buscarMatriculaPorId)

app
  .listen({
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT}`)
  })
