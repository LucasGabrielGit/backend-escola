import type { Disciplina } from '@prisma/client'
import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'

export class DisciplinaController {
  async deletar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      if (
        !(await prisma.disciplina.findUnique({ where: { id: parseInt(id) } }))
      ) {
        return res.status(404).send({ message: 'Disciplina não encontrada' })
      }
      await prisma.disciplina
        .delete({
          where: { id: parseInt(id) },
        })
        .then(() => {
          return res.send({ message: 'Disciplina deletada com sucesso!' })
        })
        .catch((err) => {
          console.log(err.message)
        })
    } catch (err) {
      return res.status(500).send({
        message: 'Erro ao deletar disciplina',
        error: err,
      })
    }
  }
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const disciplinaDTO = req.body as Disciplina

      const newDisciplina = await prisma.disciplina.create({
        data: disciplinaDTO,
      })

      return {
        disciplina: newDisciplina,
      }
    } catch (error) {
      return res.status(500).send({
        message: 'Erro ao cadastrar disciplina',
        error: error,
      })
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const disciplinas = await prisma.disciplina.findMany({
        include: { professor: true },
      })
      if (disciplinas === null) {
        return res
          .status(404)
          .send({ message: 'Nenhuma disciplina encontada!' })
      }

      return res.send(disciplinas)
    } catch (err) {
      return res.status(500).send({ message: err })
    }
  }
}
