import { periodoDoDia, type PeriodoDoDia } from "@orion/core";

// Uma frase diferente a cada visita, como o chat do Claude. Sorteadas
// no servidor, então não há risco de divergência na hidratação.
const FRASES: Record<PeriodoDoDia, string[]> = {
  madrugada: [
    "Boa madrugada",
    "Ainda de pé",
    "A madrugada é sua",
    "Silêncio bom pra codar",
    "Vira logo esse dia",
  ],
  manha: [
    "Bom dia",
    "Dia novo",
    "Começando cedo",
    "Bora começar",
    "Manhã limpa",
  ],
  tarde: [
    "Boa tarde",
    "Meio do caminho",
    "Tarde produtiva",
    "Segue o jogo",
    "Ainda dá tempo",
  ],
  noite: [
    "Boa noite",
    "Reta final do dia",
    "Fim de expediente",
    "Hora de fechar o dia",
    "Noite tranquila",
  ],
};

export function saudacao(minutos: number, nome: string | null): string {
  const opcoes = FRASES[periodoDoDia(minutos)];
  const frase = opcoes[Math.floor(Math.random() * opcoes.length)]!;
  return nome ? `${frase}, ${nome}` : frase;
}
