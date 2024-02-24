import type { PessoaFisica, Professor } from '@prisma/client'
import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'

export class ProfessorController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { pessoaFisica, professor } = req.body as {
        pessoaFisica: PessoaFisica
        professor: Professor
      }

      let pessoaFisicaExistente = await prisma.pessoaFisica.findFirst({
        where: {
          cpf: { contains: pessoaFisica.cpf },
        },
      })

      console.log(pessoaFisica)

      if (!pessoaFisicaExistente) {
        pessoaFisicaExistente = await prisma.pessoaFisica.create({
          data: { ...pessoaFisica },
        })
      }

      await prisma.professor.create({
        data: {
          areaEspecializacao: professor.areaEspecializacao,
          titulacao: professor.titulacao,
          pessoaFisica: { connect: { id: pessoaFisicaExistente.id } },
          disciplinas: {
            connect: {
              id: Number(professor.disciplinaId)
            }
          },
          turmas: {
            connect: {
              id: Number(professor.turmaId)
            }
          },
          disciplinaId: professor.disciplinaId,
          turmaId: professor.turmaId
        },
      }).then(() => {
        return res.status(201).send({
          message: 'Professor cadastrado com sucesso!',
        })
      }).catch((err) => {
        console.log(err)
      })

    } catch (err) {
      console.log(err)
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const professores = await prisma.professor
        .findMany({
          include: {
            pessoaFisica: true,
            disciplinas: true,
          },
        })
        .catch((err) => {
          console.log(err.message)
        })

      return res.send(professores)
    } catch (error) {
      return res.status(500).send({
        message: 'Erro ao listar professores',
        error: error,
      })
    }
  }

  async atualizar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const { pessoaFisica, professor } = req.body as {
        pessoaFisica: PessoaFisica
        professor: Professor
      }


      await prisma.professor
        .update({
          data: {
            ...professor,
            ...pessoaFisica,
          },
          where: { id: parseInt(id) },
        })
        .then(() => {
          return res.send({ message: 'Professor atualizado com sucesso!' })
        })
        .catch((err) => {
          console.log(err.message)
        })
    } catch (error) {
      return res.status(500).send({
        message: 'Erro ao atualizar os dados do professor',
        error: error,
      })
    }
  }


}
