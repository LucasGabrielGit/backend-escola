function gerarSenha() {
  return (
    Math.random().toString(12).substring(2, 6) +
    Math.random().toString(12).substring(2, 6)
  )
}

function gerarUsuario(nome: string, cpf: string) {
  return nome
    .toLowerCase()
    .split(' ')[0]
    .concat(`_${cpf.split('.')[0]}`)
}

export { gerarSenha, gerarUsuario }
