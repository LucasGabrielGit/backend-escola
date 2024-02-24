/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Matricula, Nota } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../client/prisma'

export class MatriculaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { matricula } = req.body as {
        matricula: Matricula
      }

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
              status: matricula.status,
              numeroMatricula: String(Math.floor(Math.random() * 10000)),
              alunos: {
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
          alunos: {
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
            },
          },
          pendencias: true,
          turma: true,
          notas: {
            select: {
              disciplina: {
                select: {
                  nome: true,
                },
              },
              nota1: true,
              nota2: true,
              nota3: true,
              nota4: true,
            },
          },
        },
      })

      return { matriculas }
    } catch (error) {
      return res.status(500).send({ message: error })
    }
  }

  async salvarNotas(req: FastifyRequest, res: FastifyReply): Promise<void> {
    try {
      const { id } = req.params as {
        id: string
      }
      const { notas, disciplina } = req.body as { notas: Nota, disciplina: number }

      const notasExistentes = await prisma.nota.findFirst({
        where: {
          disciplinaId: disciplina
        },
      })

      const matriculaExistente = await prisma.matricula.findFirst({
        where: {
          id: notasExistentes?.matriculaId
        },
        include: {
          alunos: {
            select: {
              pessoaFisica: true,
            },
          },
        },
      })

      if (matriculaExistente === null) {
        return res.status(404).send({ error: 'Matricula não encontrada' })
      }


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
              matriculaId: parseInt(id)
            },
          }
          ).then(() => {
            return res.status(200).send({
              message: 'As notas do aluno foram atualizadas com sucesso',
            })
          })
      }
      else {
        await prisma.nota
          .create({
            data: {
              nota1: notas.nota1,
              nota2: notas.nota2,
              nota3: notas.nota3,
              nota4: notas.nota4,
              matriculaId: parseInt(id),
              disciplinaId: disciplina
            }
          }
          )
          .then(() => {
            return res.status(200).send({
              message: 'As notas do aluno foram lançadas com sucesso',
            })
          })

      }


      // if (!notasExistentes) {
      //   await prisma.nota
      //     .create({
      //       data: {
      //         nota1: notas.nota1,
      //         nota2: notas.nota2,
      //         nota3: notas.nota3,
      //         nota4: notas.nota4,
      //         matricula: {
      //           connect: {
      //             id: matriculaExistente.id
      //           },
      //         },
      //         disciplina: {
      //           connect: {
      //             id: (disciplina),
      //           }
      //         }
      //       },
      //     })
      //     .then(() => {
      //       return res.status(200).send({
      //         message: 'As notas do aluno foram lançadas no sistema',
      //       })
      //     }).catch(err => err.message)
      // }
    }
    catch (e) {
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
                mode: 'insensitive'
              },
            },
            {
              alunos: {
                pessoaFisica: {
                  nome: {
                    contains: nomeAluno,
                    mode: 'insensitive'
                  }
                }
              },
            },
          ],
        },
        include: {
          alunos: {
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
          alunos: { include: { pessoaFisica: true } },
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

  async lancarPendencia(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const { pendencia, disciplinaId } = req.body as { pendencia: string, disciplinaId: number }

      const matricula = await prisma.matricula.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          pendencias: true,
          turma: {
            select: {
              disciplinas: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      })

      if (!matricula) {
        return res.status(404).send({ message: 'Matrícula não encontrada' })
      }

      await prisma.matricula.update({
        data: {
          pendencias: {
            connectOrCreate: {
              create: {
                descricao: pendencia,
                disciplinaId,
                matriculaId: matricula.id
              },
              where: {
                id: matricula.id
              }
            }
          }
        },
        where: {
          id: matricula.id
        }
      }).then(() => res.status(201).send({ message: 'Pendência registrada com sucesso!' }))

    } catch (error: any) {
      return res.status(500).send({ error: error.message })
    }
  }

  async alterar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }
      const { matricula } = req.body as { matricula: Matricula }

      // Verifica se a turma associada à matrícula existe e se há capacidade disponível
      const turmaExistente = await prisma.turma.findFirst({
        where: {
          id: matricula.turmaId,
        },
      })

      const matriculaExistente = await prisma.matricula.findUnique({
        where: {
          id: parseInt(id)
        },
      })

      if (!matriculaExistente) {
        return res.status(404).send({ message: 'Matrícula não encontrada' })
      }

      if (!turmaExistente || turmaExistente.capacidade <= 0) {
        return res.status(500).send({ message: 'Não há vagas para esta turma' })
      }

      // Atualiza os dados da matrícula
      await prisma.matricula.update({
        where: { id: parseInt(id) },
        data: {
          dataMatricula: matriculaExistente.dataMatricula,
          status: matricula.status,
          turma: {
            connect: { id: matricula.turmaId },
          },
        },
      })

      // Atualiza a capacidade da turma
      await prisma.turma.update({
        where: { id: turmaExistente.id },
        data: { capacidade: turmaExistente.capacidade - 1 },
      })

      return res.status(201).send({ message: 'Matrícula finalizada com sucesso!' })
    } catch (error: any) {
      console.log(error.message)
      return res.status(500).send({ error: error.message })
    }
  }

}

