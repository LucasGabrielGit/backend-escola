/* eslint-disable @typescript-eslint/no-explicit-any */
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
        include: {
          professor: true, nota: {
            select: {
              matricula: {
                select: {
                  alunos: {
                    select: {
                      pessoaFisica: true
                    }
                  },
                }
              },
              disciplina: {
                select: {
                  nome: true,
                  nivel: true
                },
              },
              nota1: true,
              nota2: true,
              nota3: true,
              nota4: true,
            }
          }
        },
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

  async atualizar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const data = req.body as Disciplina

      await prisma.disciplina
        .findUnique({
          where: {
            id: parseInt(id),
          },
        })
        .then(async (response) => {
          await prisma.disciplina
            .update({
              data: data,
              where: { id: response?.id },
            })
            .then(() => {
              return res
                .status(200)
                .send({ message: 'Disciplina atualizada com sucesso!' })
            })
            .catch((err) => {
              return res.status(500).send({ message: err.message })
            })
        })
        .catch(() => {
          return res.status(500).send({ message: 'Disciplina não encontrado!' })
        })
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async buscarPorId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const disciplina = await prisma.disciplina.findUnique({
        where: { id: parseInt(id) }
      })

      if (!disciplina) {
        return res.status(404).send({ message: 'Disciplina não encontrada' })
      }

      return res.status(200).send(disciplina)
    } catch (error: any) {
      return res.status(500).send({ message: error.messafe })
    }
  }
}
