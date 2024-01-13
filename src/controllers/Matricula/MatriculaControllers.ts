import type { Matricula, Nota } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../client/prisma'

export class MatriculaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { matricula } = req.body as {
        matricula: Matricula
      }

      const alunoExistente = await prisma.aluno.findUnique({
        where: {
          id: matricula.alunoId,
        },
      })

      console.log(alunoExistente)

      const turmaExistente = await prisma.turma.findFirst({
        where: {
          id: matricula.turmaId,
        },
      })

      if (turmaExistente === null) {
        return res.status(404).send({ error: 'Turma não encontrada' })
      }

      const matriculaExistente = await prisma.matricula.findFirst({
        where: {
          alunoId: matricula.alunoId,
        },
      })

      if (matriculaExistente !== null) {
        return res
          .status(409)
          .send({ error: 'Já existe uma matrícula para este aluno' })
      }

      if (turmaExistente.capacidade > 0) {
        await prisma.matricula
          .create({
            data: {
              dataMatricula: matricula.dataMatricula,
              observacoes: matricula.observacoes,
              status: matricula.status,
              numeroMatricula: String(Math.floor(Math.random() * 10000)),
              aluno: {
                connect: {
                  id: matricula.alunoId,
                },
              },
              turma: {
                connect: {
                  id: matricula.turmaId,
                },
              },
            },
          })
          .then(async () => {
            await prisma.turma.update({
              where: { id: turmaExistente.id },
              data: {
                capacidade: turmaExistente.capacidade - 1,
              },
            })
          })
      } else {
        return res.status(500).send({ message: 'Não há vagas para esta turma' })
      }

      return res.status(201).send({
        message: 'Matrícula finalizada com sucesso!',
      })
    } catch (error) {
      return res.status(500).send({ error: error })
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const matriculas = await prisma.matricula.findMany({
        include: {
          aluno: {
            select: {
              pessoaFisica: {
                select: {
                  id: true,
                  nome: true,
                  cpf: true,
                  rg: true,
                  numTelefone: true,
                  observacoes: true,
                },
              },
              usuario: true,
              pendencias: {
                select: {
                  descricao: true,
                },
              },
            },
          },
          turma: true,
          notas: true,
        },
      })

      return { matriculas }
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async salvarNotas(req: FastifyRequest, res: FastifyReply): Promise<void> {
    try {
      const { notas, matriculaId } = req.body as {
        notas: Nota
        matriculaId: number
      }

      const matriculaExistente = await prisma.matricula.findFirst({
        where: {
          id: matriculaId,
        },
        include: {
          aluno: {
            select: {
              pessoaFisica: true,
            },
          },
        },
      })

      if (matriculaExistente === null) {
        return res.status(404).send({ error: 'Matricula não encontrada' })
      }

      const notasExistentes = await prisma.nota.findFirst({
        where: {
          matriculaId,
        },
      })

      if (notasExistentes !== null) {
        await prisma.nota
          .update({
            where: {
              id: notasExistentes?.id,
            },
            data: {
              nota1: notas.nota1,
              nota2: notas.nota2,
              nota3: notas.nota3,
              nota4: notas.nota4,
            },
          })
          .then(() => {
            return res.status(200).send({
              message: `As notas do aluno {${matriculaExistente.aluno.pessoaFisica.nome}} foram atualizadas com sucesso`,
            })
          })
      }

      if (!notasExistentes) {
        await prisma.nota
          .create({
            data: {
              nota1: notas.nota1,
              nota2: notas.nota2,
              nota3: notas.nota3,
              nota4: notas.nota4,
              matricula: {
                connect: {
                  id: Number(matriculaId),
                },
              },
            },
          })
          .then(() => {
            return res.status(200).send({
              message: `As notas do aluno {${matriculaExistente.aluno.pessoaFisica.nome}} foram lançadas no sistema`,
            })
          })
      }
    } catch (e) {
      return res.status(500).send({ message: e })
    }
  }

  async buscarPorMatriculaOuNome(req: FastifyRequest, res: FastifyReply) {
    try {
      const { nomeAluno, numeroMatricula } = req.body as {
        numeroMatricula: string
        nomeAluno: string
      }

      const matricula = await prisma.matricula.findMany({
        where: {
          OR: [
            {
              numeroMatricula: {
                contains: numeroMatricula,
              },
            },
            {
              aluno: {
                pessoaFisica: {
                  nome: {
                    contains: nomeAluno,
                  },
                },
              },
            },
          ],
        },
        include: {
          aluno: {
            include: {
              pessoaFisica: true,
            },
          },
          turma: true,
        },
      })

      return res.status(200).send(matricula)
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'Ocorreu um erro ao buscar matrícula', error })
    }
  }

  async buscarMatriculaPorId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }

      const matricula = await prisma.matricula.findUnique({
        where: { id: parseInt(id) },
        include: {
          aluno: { include: { pessoaFisica: true } },
          notas: true,
          turma: true,
        },
      })

      if (!matricula)
        return res.status(404).send({ message: 'Matrícula não encontrada' })

      return res.status(200).send(matricula)
    } catch (error) {
      return res.status(500).send({ error: error })
    }
  }
}
