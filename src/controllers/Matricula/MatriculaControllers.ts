import type { Aluno, Matricula, Nota, Professor } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../client/prisma';

export class MatriculaController {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const { matricula } = req.body as {
        matricula: Matricula;
      };

      const alunoExistente = await prisma.aluno.findUnique({
        where: {
          id: matricula.alunoId,
        },
      });

      const turmaExistente = await prisma.turma.findFirst({
        where: {
          id: matricula.turmaId,
        },
      });

      if (!alunoExistente) {
        return res.status(404).send({ error: 'Aluno não encontrado' });
      }

      const matriculaExistente = await prisma.matricula.findFirst({
        where: {
          alunoId: matricula.alunoId,
        },
      });

      if (matriculaExistente) {
        return res.status(400).send({
          error: `O aluno já está vinculado à turma: ${turmaExistente?.periodo}`,
        });
      }

      const newMatricula = await prisma.matricula.create({
        data: {
          dataMatricula: matricula.dataMatricula,
          observacoes: matricula.observacoes,
          status: matricula.status,
          numeroMatricula: String(Math.floor(Math.random() * 10000)),
          aluno: {
            connect: {
              id: alunoExistente?.id,
            },
          },
          statusMatricula: {
            create: {
              descricao: matricula.status === 0 ? 'Ativa' : 'Inativa',
            },
          },
          turma: {
            connect: {
              id: matricula.turmaId,
            },
          },
        },
      });

      console.log({
        newMatricula,
      });
    } catch (error) {}
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const matriculas = await prisma.matricula.findMany({
        include: {
          aluno: true,
          turma: true,
          notas: true,
        },
      });

      return { matriculas };
    } catch (error: any) {
      return res.status(500).send({ message: error.message });
    }
  }

  async salvarNotas(req: FastifyRequest, res: FastifyReply) {
    try {
      const { notas, matriculaId } = req.body as {
        notas: Nota;
        matriculaId: number;
      };

      const matriculaExistente = await prisma.matricula.findFirst({
        where: {
          id: matriculaId,
        },
        include: {
          aluno: {
            select: {
              pessoaFisica: true,
            },
          },
        },
      });

      if (!matriculaExistente) {
        return res.status(404).send({ error: 'Matricula não encontrada' });
      }

      const notasExistentes = await prisma.nota.findFirst({
        where: {
          matriculaId,
        },
      });

      if (notasExistentes) {
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
            },
          })
          .then(() => {
            return res.status(200).send({
              message: `As notas do aluno {${matriculaExistente.aluno.pessoaFisica.nome}} foram atualizadas com sucesso`,
            });
          });
      }

      if (!notasExistentes) {
        await prisma.nota
          .create({
            data: {
              nota1: notas.nota1,
              nota2: notas.nota2,
              nota3: notas.nota3,
              nota4: notas.nota4,
              matricula: {
                connect: {
                  id: Number(matriculaId),
                },
              },
            },
          })
          .then(() => {
            return res.status(200).send({
              message: `As notas do aluno {${matriculaExistente.aluno.pessoaFisica.nome}} foram lançadas no sistema`,
            });
          });
      }
    } catch (e: any) {
      return res.status(500).send({ message: e.message });
    }
  }
}
