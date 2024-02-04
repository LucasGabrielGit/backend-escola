
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../client/prisma'
import type { Disciplina, Professor, } from '@prisma/client'

type TurmaType = {
  id?: number
  ano: string
  periodo: string
  capacidade: number
  turno: string
  professores: Professor[]
  disciplinas: Disciplina[]
}

export class TurmaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const turma = req.body as TurmaType

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
        data: {
          ...turma,
          professores: {
            connect: turma.professores ? turma.professores.map(professor => ({ id: professor.id })) : undefined
          },
          disciplinas: {
            connect: turma.disciplinas ? turma.disciplinas.map(disciplina => ({ id: disciplina.id })) : undefined
          }
        },
      })



      console.log(newTurma)

      return { newTurma }
    } catch (error: any) {
      return res.status(500).send({ message: error.message })
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const turmas = await prisma.turma.findMany({
        include: {
          matriculas: {
            select: {
              alunos: {
                select: {
                  pessoaFisica: {
                    select: {
                      nome: true,
                    },
                  }
                },
              }

            },
          },
          disciplinas: {
            select: {
              nome: true,
            },
          },
          professores: {
            select: {
              areaEspecializacao: true,
              pessoaFisica: {
                select: {
                  nome: true,
                }
              }
            }
          }
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

  async buscarPorId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      await prisma.turma
        .findUnique({
          where: {
            id: parseInt(id),
          },
          include: {
            matriculas: {
              include: {
                alunos: {
                  include: {
                    pessoaFisica: true,
                  },
                },
                notas: true,
                turma: true,
              },
            },
          },
        })
        .then((response) => {
          return res.status(200).send(response)
        })
        .catch((err) => {
          return res.status(500).send(err.message)
        })
    } catch (error) {
      return res.status(500).send(error)
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
              alunos: true,
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
      const turmaDTO = req.body as TurmaType

      await prisma.turma
        .update({
          data: {
            ...turmaDTO,
            professores: {
              connect: turmaDTO.professores ? turmaDTO.professores.map(professor => ({ id: professor.id })) : undefined
            },
            disciplinas: {
              connect: turmaDTO.disciplinas ? turmaDTO.disciplinas.map(disciplina => ({ id: disciplina.id })) : undefined
            }
          },
          where: {
            id: parseInt(id),
          },
        })
        .then(() => {
          return res.send({ message: 'Turma atualizada com sucesso!' })
        })
    } catch (error: any) {
      return res.status(500).send({
        message: error.message,
      })
    }
  }

  async removerDisciplina(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const { disciplinas } = req.body as { disciplinas: number[] }
      const turma = await prisma.turma.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          disciplinas: true,
          professores: true,
        }
      })
      console.log(disciplinas)

      if (turma !== null) {
        const disciplinasAtualizadas = turma.disciplinas.filter(d => disciplinas ? disciplinas.includes(d.id) : undefined)
        console.log(disciplinasAtualizadas)
        await prisma.turma.update({
          where: {
            id: parseInt(id)
          },
          data: {
            disciplinas: {
              disconnect: disciplinas ? disciplinas.map((disciplina: any) => ({ id: Number(disciplina.id) })) : undefined
            }
          }

        }).then(() => {
          return res.status(200).send({
            message: 'Disciplina removida com sucesso da turma!'
          })
        }).catch((err) => {
          return res.status(500).send({ error: err.message })
        })
      }
    } catch (err: any) {
      console.log(err.message)
    }
  }
}
