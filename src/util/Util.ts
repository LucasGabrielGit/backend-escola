function gerarSenha() {
  return (
    Math.random().toString(12).substring(2, 6) +
    Math.random().toString(12).substring(2, 6)
  );
}

export { gerarSenha };
