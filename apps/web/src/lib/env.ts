// Leitura de variáveis de ambiente com erro claro quando faltam —
// melhor falhar na hora com o nome da variável do que com um
// "undefined" misterioso no meio de uma request.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Veja apps/web/.env.example.`,
    );
  }
  return value;
}
