import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { hash } from 'bcrypt'
import type { PessoaFisica } from '@prisma/client'
import { gerarSenha } from '../../util/Util'

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
          usuario: newPessoaFisica.nome
            .toLowerCase()
            .split(' ')[0]
            .concat(`_${pessoaFisicaDTO.cpf.split('.')[0]}`),
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
          matriculas: true
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
        id: string;
      }
      const { descricao } = req.body as { descricao: string; }

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

  async deletarAluno(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as {
        id: string;
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
                    id: 2
                  }
                }
              },
            },
          },
        },
      })

      return res.status(200).send({
        message: 'A matrícula do aluno foi desativada'
      })
    } catch (err) {
      return res.status(500).send({ err: err })
    }
  }

  async buscarPorNumeroMatriculaOuNome(req: FastifyRequest, res: FastifyReply) {
    try {
      const { numeroMatricula, nome } = req.body as {
        numeroMatricula: string;
        nome: string;
      }

      const resultado = await prisma.aluno.findMany({
        where: {
          OR: [{
            pessoaFisica: {
              nome: {
                contains: nome
              }
            },
            matriculas: {
              some: {
                numeroMatricula
              }
            },
          }]
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
