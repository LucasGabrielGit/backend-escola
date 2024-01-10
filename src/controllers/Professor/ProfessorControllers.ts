import type { PessoaFisica, Professor } from '@prisma/client'
import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'

// type Professor = {
//   id?: number
//   pessoaFisicaId?: number
//   disciplinaId: number
//   titulacao: string
//   areaEspecializacao: string
//   observacoes: string
//   disciplina?: {
//     id?: number
//     nome?: string
//     descricao?: string
//     cargaHoraria?: string
//     nivel?: string
//     observacoes?: string
//   }
// }
export class ProfessorController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { pessoaFisica, professor } = req.body as {
        pessoaFisica: PessoaFisica
        professor: Professor
      }

      console.log(req.body)

      const pessoaFisicaExistente = await prisma.pessoaFisica.findFirst({
        where: {
          cpf: { contains: pessoaFisica.cpf },
        },
      })

      if (!pessoaFisicaExistente) {
        await prisma.pessoaFisica
          .create({
            data: { ...pessoaFisica },
          })
          .then(async (p) => {
            await prisma.professor.create({
              data: {
                areaEspecializacao: professor.areaEspecializacao,
                observacoes: professor.observacoes,
                titulacao: professor.titulacao,
                pessoaFisica: {
                  connect: {
                    id: p.id,
                  },
                },
                disciplina: {
                  connect: {
                    id: professor.disciplinaId,
                  },
                },
              },
            })
          })
          .catch((err) => {
            console.log(err)
          })
      }

      return res.status(201).send({
        message: 'Professor cadastrado com sucesso!',
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
            disciplina: true,
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
      const professorDTO = {
        ...professor,
      }

      const professorExistente = await prisma.professor.findUnique({
        where: { id: parseInt(id) },
        include: { disciplina: true, pessoaFisica: true },
      })

      if (professorExistente !== null) {
        await prisma.pessoaFisica.update({
          where: { id: professorExistente.pessoaFisicaId },
          data: {
            ...pessoaFisica,
          },
        })

        await prisma.professor
          .update({
            data: {
              areaEspecializacao: professorDTO.areaEspecializacao,
              disciplinaId: professorDTO.disciplinaId,
              observacoes: professorDTO.observacoes,
              pessoaFisicaId: professorExistente.pessoaFisicaId,
              titulacao: professorDTO.titulacao,
            },
            where: { id: professorExistente.id },
          })
          .then(() => {
            return res.send({ message: 'Professor atualizado com sucesso!' })
          })
          .catch((err) => {
            console.log(err.message)
          })
      }
    } catch (error) {
      return res.status(500).send({
        message: 'Erro ao atualizar os dados do professor',
      })
    }
  }
}
