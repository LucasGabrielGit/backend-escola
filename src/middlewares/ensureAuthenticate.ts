import type { FastifyReply, FastifyRequest } from 'fastify'
import { verify } from 'jsonwebtoken'

export function middlewareAuthentication(
  req: FastifyRequest,
  res: FastifyReply
) {
  const authToken = req.headers.authorization

  if (!authToken) {
    res.status(401).send({
      message: 'Token de autenticação não encontrado'
    })
    return
  }

  const [, token] = authToken.split(' ')

  try {
    return verify(token, String(process.env.JWT_SECRET_TOKEN))
  } catch (err) {
    return res.status(401).send({
      message: 'Token de autenticação inválido'
    })
  }
}
