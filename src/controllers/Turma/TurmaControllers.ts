import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../client/prisma'
import type { Turma } from '@prisma/client'

export class TurmaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const turma = req.body as Turma

      const turmaExistente = await prisma.turma.findFirst({
        where: {
          periodo: turma.periodo,
          AND: {
            turno: turma.turno,
            ano: turma.ano,
          },
        },
      })

      if (turmaExistente) {
        return res.status(400).send({
          message: 'Já existe uma turma com este turno, periodo e ano.',
        })
      }

      const newTurma = await prisma.turma.create({
        data: turma,
      })

      return { newTurma }
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const turmas = await prisma.turma.findMany({
        include: {
          matriculas: {
            include: {
              aluno: true,
            },
          },
        },
      })

      return { turmas }
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async deletar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }

      const turmaExistente = await prisma.turma.findUnique({
        where: {
          id: parseInt(id),
        },
      })

      const turmaVazia = await prisma.turma.findFirst({
        where: {
          id: parseInt(id),
          AND: {
            matriculas: {
              none: {},
            },
          },
        },
      })

      if (!turmaVazia) {
        return res.status(500).send({
          message:
            'Não é possível deletar uma turma que possua matrículas ativas!',
        })
      }

      if (!turmaExistente) {
        return res.status(404).send({ message: 'Turma não encontrada' })
      }

      await prisma.turma.delete({
        where: {
          id: parseInt(id),
        },
      })

      return res.send({ message: 'Turma deletada com sucesso!' })
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async buscarPorNome(req: FastifyRequest, res: FastifyReply) {
    try {
      const { periodo } = req.body as { periodo: string }

      const turmas = await prisma.turma.findMany({
        where: {
          periodo,
        },
        include: {
          matriculas: {
            include: {
              aluno: true,
            },
          },
        },
      })

      return { turmas }
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async atualizarTurma(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string } 
      const turmaDTO = req.body as Turma

      const turmaExistente = await prisma.turma.findUnique({
        where: {
          id: parseInt(id),
        }
      })

      if (!turmaExistente) {
        return res.status(404).send({
          message: 'Turma não encontrada',
        })
      }

     await prisma.turma.update({
        data: turmaDTO,
        where: {
          id: parseInt(id),
        }
      }).then(() => {
        return res.send({ message: 'Turma atualizada com sucesso!' })
      })

    } catch (error) {
      return res.status(500).send({
        message: error
      })
    }
  }
}
