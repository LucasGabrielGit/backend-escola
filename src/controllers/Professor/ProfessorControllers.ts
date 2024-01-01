import type { PessoaFisica, Professor } from '@prisma/client'
import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'

export class ProfessorController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { pessoaFisica, professor } = req.body as {
        pessoaFisica: PessoaFisica;
        professor: Professor;
      }

      const pessoaFisicaExistente = await prisma.pessoaFisica.findFirst({
        where: {
          cpf: { contains: pessoaFisica.cpf },
        },
      })

      console.log({ pessoaFisicaExistente })

      if (!pessoaFisicaExistente) {
        await prisma.pessoaFisica
          .create({
            data: pessoaFisica,
          })
          .catch((err) => {
            console.log(err)
          })
      }

      const professorExistente = await prisma.professor.findFirst({
        where: {
          pessoaFisicaId: pessoaFisicaExistente?.id,
        },
      })
      console.log(professorExistente)

      if (professorExistente) {
        return res.status(409).send({ message: 'Professor já cadastrado' })
      }

      const newProfessor = await prisma.professor.create({
        data: {
          areaEspecializacao: professor.areaEspecializacao,
          observacoes: professor.observacoes,
          titulacao: professor.titulacao,
          pessoaFisica: {
            connect: {
              id: pessoaFisicaExistente?.id,
            },
          },
          disciplina: {
            connect: {
              id: professor.disciplinaId,
            },
          },
        },
      })

      return res.status(201).send({
        message: 'Professor cadastrado com sucesso!',
        newProfessor,
      })
    } catch (err) {
      console.log(err)
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const professores = await prisma.professor.findMany({
        include: {
          disciplina: {
            select: {
              descricao: true,
              nome: true,
              nivel: true,
            },
          },
          pessoaFisica: true,
        },
      })

      return {
        professores,
      }
    } catch (error) {
      return res.status(500).send({
        message: 'Erro ao listar professores',
        error: error,
      })
    }
  }
}
