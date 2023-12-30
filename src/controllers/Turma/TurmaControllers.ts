import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../client/prisma'
import type { Turma } from '@prisma/client'

export class TurmaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const turma = req.body as Turma

      const newTurma = await prisma.turma.create({
        data: turma
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
              aluno: true
            }
          }
        }
      })

      return { turmas }
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }
}
