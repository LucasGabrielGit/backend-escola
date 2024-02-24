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
app.delete('/aluno/deletarAluno/:id', alunoController.deletarAluno)
app.get('/aluno/detalhe/:id', alunoController.buscarPorId)
app.post('/aluno/buscar', alunoController.buscarPorNumeroMatriculaOuNome)
app.patch('/aluno/atualizar/:id', alunoController.atualizarAluno)


app.post('/login', alunoController.login)

// Rotas de Professor
app.post('/professor/salvar', professorController.salvar)
app.get('/professor/listar', professorController.listar)
app.patch('/professor/atualizar/:id', professorController.atualizar)

// Rotas de Disciplina
app.post('/disciplina/salvar', disciplinaController.salvar)
app.get('/disciplina/listar', disciplinaController.listar)
app.delete('/disciplina/deletar/:id', disciplinaController.deletar)
app.get('/disciplina/:id', disciplinaController.buscarPorId)

// Rotas de turma
app.post('/turma/salvar', turmaController.salvar)
app.get('/turma/listar', turmaController.listar)
app.get('/turma/detalhe/:id', turmaController.buscarPorId)
app.delete('/turma/deletar/:id', turmaController.deletar)
app.post('/turma/buscar', turmaController.buscarPorNome)
app.put('/turma/atualizar/:id', turmaController.atualizarTurma)
app.put('/turma/remover-disciplina/:id', turmaController.removerDisciplina)

// Rotas de matricula
app.post('/matricula/salvar', new MatriculaController().salvar)
app.post('/matricula/salvarNotas/:id', new MatriculaController().salvarNotas)
app.get('/matricula/listar', new MatriculaController().listar)
app.post(
  '/matricula/buscar',
  new MatriculaController().buscarPorMatriculaOuNome
)
app.post(
  '/matricula/lancar-pendencia/:id',
  new MatriculaController().lancarPendencia
)
app.put(
  '/matricula/alterar/:id',
  new MatriculaController().alterar
)
app.get(
  '/matricula/detalhe/:id',
  new MatriculaController().buscarMatriculaPorId
)

app
  .listen({
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT}`)
  })
