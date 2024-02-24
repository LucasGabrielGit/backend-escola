/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../../client/prisma'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Aluno, PessoaFisica } from '@prisma/client'
import { gerarSenha, gerarUsuario } from '../../util/Util'
import { compare, hash } from 'bcrypt'
import jwt from 'jsonwebtoken'


interface AuthData {
  token: string;
  usuario: Aluno
}

export class AlunoControllers {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { pessoaFisica } = req.body as { pessoaFisica: PessoaFisica }
      console.log(pessoaFisica)
      const pessoaFisicaExistente = await prisma.pessoaFisica.findUnique({
        where: {
          cpf: pessoaFisica.cpf,
        },
      })

      if (!pessoaFisicaExistente) {
        const newPessoaFisica = await prisma.pessoaFisica.create({
          data: pessoaFisica,
        })
        const senha = gerarSenha()
        const hashedSenha = await hash(senha, 8)
        await prisma.aluno
          .create({
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
          .then((a) => {
            return res.status(201).send({
              senha,
              usuario: a.usuario,
            })
          })
      } else {
        return res.status(409).send({
          message: 'Já existe um registro com o CPF/RG informado',
        })
      }

      return res.status(201)
    } catch (error: any) {
      return await res.status(500).send({
        message: 'Erro ao cadastrar pessoa fisica',
        error: error.message,
      })
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const alunos = await prisma.aluno.findMany({
        include: {
          pessoaFisica: true,
          matricula: {
            select: {
              dataMatricula: true,
              numeroMatricula: true,
              turma: true,
              status: true,
            },
          },
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

  async atualizarAluno(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as {
        id: string
      }
      const alunoDTO = req.body as PessoaFisica

      const alunoExistente = await prisma.aluno.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          pessoaFisica: true,
        },
      })

      if (!alunoExistente) {
        return res.status(404).send({ error: 'Aluno não encontrado' })
      }

      await prisma.aluno
        .update({
          data: {
            pessoaFisica: { update: alunoDTO },
          },
          where: {
            id: parseInt(id)
          },
        })
        .then(async () => {
          return res.send({ message: 'Aluno atualizado com sucesso!' })
        })
        .catch((error) => {
          console.log(error.message)
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
          id: parseInt(id)
        },
        include: {
          matricula: true,
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
            matricula: {
              some: {
                status: 1,
              },
            },
          },
        },
        include: {
          matricula: {
            select: {
              dataMatricula: true,
              numeroMatricula: true,
              status: true,
              turma: true,
            },
          },
        },
      })

      await prisma.aluno.update({
        where: {
          id: parseInt(id)
        },
        data: {
          matricula: {
            update: {
              where: {
                alunos: {
                  id: parseInt(id)
                },
                numeroMatricula: alunoExistente.matricula[0].numeroMatricula,
              },
              data: {
                status: 1,
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
              matricula: {
                some: {
                  numeroMatricula,
                },
              },
            },
          ],
        },
        include: {
          matricula: true,
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

  async buscarPorId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string }

      console.log(id)

      await prisma.aluno
        .findUnique({
          where: { id: parseInt(id) },
          include: {
            pessoaFisica: true,
          },
        })
        .then((response) => {
          return res.status(200).send(response)
        })
        .catch((error) => {
          return res.status(500).send(error.message)
        })
    } catch (error) {
      return res.status(500).send(error)
    }
  }

  async login(req: FastifyRequest, reply: FastifyReply): Promise<AuthData> {
    const { login, senha } = req.body as { login: string; senha: string }


    const usuario = await prisma.aluno.findFirst({
      where: {
        usuario: login,
      },
      select: {
        id: true,
        matricula: true,
        pessoaFisica: true,
        senha: true,
        usuario: true,
        pessoaFisicaId: true
      }
    })


    if (!usuario) throw new Error('Usuário não encontrado!')

    const matchSenha = await compare(senha, usuario.senha)

    if (!matchSenha) reply.status(500).send({ message: 'Senha inválida!' })

    const token = jwt.sign({}, String(process.env.JWT_SECRET), {
      subject: usuario.id.toString(),
      expiresIn: '30m',
    })

    return { token, usuario }

  }
}
