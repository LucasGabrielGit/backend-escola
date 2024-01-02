import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { hash } from 'bcrypt'
import type { PessoaFisica } from '@prisma/client'
import { gerarSenha, gerarUsuario } from '../../util/Util'
import type { PrismaClientUnknownRequestError } from '@prisma/client/runtime/library'

export class AlunoControllers {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const pessoaFisicaDTO = req.body as PessoaFisica

      const pessoaFisicaExistente = await prisma.pessoaFisica.findUnique({
        where: {
          cpf: pessoaFisicaDTO.cpf,
        },
      })

      if (pessoaFisicaExistente) {
        return await res.send({
          message: 'Já existe um registro com o CPF/RG informado',
        })
      }

      const newPessoaFisica = await prisma.pessoaFisica.create({
        data: pessoaFisicaDTO,
      })
      const senha = gerarSenha()

      const hashedSenha = await hash(senha, 8)

      console.log({ pessoaFisicaDTO, newPessoaFisica })

      const aluno = await prisma.aluno.create({
        data: {
          pessoaFisica: {
            connect: {
              id: newPessoaFisica.id,
            },
          },
          usuario: gerarUsuario(newPessoaFisica.nome, newPessoaFisica.cpf),
          senha: hashedSenha,
        },
      })
      return {
        aluno,
        senha,
      }
    } catch (error) {
      return await res.status(500).send({
        message: 'Erro ao cadastrar pessoa fisica',
        error: error,
      })
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const alunos = await prisma.aluno.findMany({
        include: {
          pessoaFisica: true,
          matriculas: true,
        },
      })
      return await res.send(alunos)
    } catch (error) {
      return await res.status(500).send({
        message: 'Erro ao listar alunos',
        error: error,
      })
    }
  }

  async adicionarPendencia(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as {
        id: string
      }
      const { descricao } = req.body as { descricao: string }

      const alunoExistente = await prisma.aluno.findUnique({
        where: {
          id: parseInt(id),
        },
      })

      if (!alunoExistente) {
        return res.status(404).send({ error: 'Aluno não encontrado' })
      }

      const pendencia = await prisma.pendencia.create({
        data: {
          aluno: {
            connect: {
              id: alunoExistente.id,
            },
          },
          descricao,
        },
      })

      return { alunoExistente, pendencia }
    } catch (error) {
      return res.status(500).send({ error: error })
    }
  }

  async atualizarAluno(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as {
        id: string
      }
      const alunoDTO = req.body as PessoaFisica

      const alunoExistente = await prisma.aluno.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          pessoaFisica: true,
        },
      })

      console.log(alunoExistente)

      if (!alunoExistente) {
        return res.status(404).send({ error: 'Aluno não encontrado' })
      }

      await prisma.pessoaFisica
        .update({
          data: alunoDTO,
          where: {
            id: parseInt(id),
          },
        })
        .then(async (data) => {
          console.log(data)
          await prisma.aluno.update({
            where: {
              id: alunoExistente.id,
            },
            data: {
              pessoaFisica: {
                update: alunoDTO,
              },
            },
          })
          return res.send({ message: 'Aluno atualizado com sucesso!' })
        })
        .catch((error: PrismaClientUnknownRequestError) => {
          return res.send({
            message: 'Ocorreu um erro ao atualizar os dados do aluno',
            error: error.message,
          })
        })
    } catch (err) {
      console.error({ error: err })
    }
  }

  async deletarAluno(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as {
        id: string
      }

      const alunoExistente = await prisma.aluno.findUnique({
        where: {
          id: parseInt(id),
        },
        include: {
          matriculas: true,
          pessoaFisica: true,
        },
      })

      if (!alunoExistente) {
        return res.status(404).send({ error: 'Aluno não encontrado' })
      }

      await prisma.aluno.findUnique({
        where: {
          id: parseInt(id),
          AND: {
            matriculas: {
              some: {
                status: 1,
              },
            },
          },
        },
        include: {
          matriculas: {
            select: {
              dataMatricula: true,
              numeroMatricula: true,
              status: true,
              statusMatricula: true,
              turma: true,
            },
          },
        },
      })

      await prisma.aluno.update({
        where: {
          id: parseInt(id),
        },
        data: {
          matriculas: {
            update: {
              where: {
                aluno: {
                  id: parseInt(id),
                },
                numeroMatricula: alunoExistente.matriculas[0].numeroMatricula,
              },
              data: {
                status: 2,
                statusMatricula: {
                  connect: {
                    id: 2,
                  },
                },
              },
            },
          },
        },
      })

      return res.status(200).send({
        message: 'A matrícula do aluno foi desativada',
      })
    } catch (err) {
      return res.status(500).send({ err: err })
    }
  }

  async buscarPorNumeroMatriculaOuNome(req: FastifyRequest, res: FastifyReply) {
    try {
      const { numeroMatricula, nome } = req.body as {
        numeroMatricula: string
        nome: string
      }

      const resultado = await prisma.aluno.findMany({
        where: {
          OR: [
            {
              pessoaFisica: {
                nome: {
                  contains: nome,
                },
              },
              matriculas: {
                some: {
                  numeroMatricula,
                },
              },
            },
          ],
        },
        include: {
          matriculas: true,
          pessoaFisica: true,
        },
      })

      if (!resultado) {
        return res.status(404).send({ error: 'Aluno não encontrado' })
      }

      return { resultado }
    } catch (error) {
      return res.status(500).send({ error: error })
    }
  }
}
