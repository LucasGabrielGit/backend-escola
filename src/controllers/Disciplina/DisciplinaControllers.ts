import type { Disciplina } from '@prisma/client'
import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'

export class DisciplinaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const disciplinaDTO = req.body as Disciplina

      const disciplinaExistente = await prisma.disciplina.findFirst({
        where: {
          nome: disciplinaDTO.nome
        }
      })

      if (disciplinaExistente) {
        return res.send({
          message: 'Já existe uma disciplina com o nome informado'
        })
      }

      const newDisciplina = await prisma.disciplina.create({
        data: disciplinaDTO
      })

      console.log({ disciplinaDTO, newDisciplina })

      return {
        disciplina: newDisciplina
      }
    } catch (error) {
      return res.status(500).send({
        message: 'Erro ao cadastrar disciplina',
        error: error
      })
    }
  }
}
