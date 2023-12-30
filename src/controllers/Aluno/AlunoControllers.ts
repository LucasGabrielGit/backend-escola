import type { Aluno, PessoaFisica } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../client/prisma';
import { gerarSenha } from '../../util/Util';
import { hash } from 'bcrypt';

export class AlunoControllers {
  async salvar(req: FastifyRequest, res: FastifyReply) {
    try {
      const pessoaFisicaDTO = req.body as PessoaFisica;

      const pessoaFisicaExistente: any = await prisma.pessoaFisica.findUnique({
        where: {
          cpf: pessoaFisicaDTO.cpf,
        },
      });

      if (pessoaFisicaExistente) {
        return res.send({
          message: 'Já existe um registro com o CPF/RG informado',
        });
      }

      const newPessoaFisica = await prisma.pessoaFisica.create({
        data: pessoaFisicaDTO,
      });
      const senha = gerarSenha();

      const hashedSenha = await hash(senha, 8);

      console.log({ pessoaFisicaDTO, newPessoaFisica });

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
      });
      console.log(aluno);
      return {
        aluno,
        senha,
      };
    } catch (error: any) {
      return res.status(500).send({
        message: 'Erro ao cadastrar pessoa fisica',
        error: error.message,
      });
    }
  }

  async listar(req: FastifyRequest, res: FastifyReply) {
    try {
      const alunos = await prisma.aluno.findMany({
        include: {
          pessoaFisica: true,
        },
      });
      return res.send(alunos);
    } catch (error: any) {
      return res.status(500).send({
        message: 'Erro ao listar alunos',
        error: error.message,
      });
    }
  }
}
