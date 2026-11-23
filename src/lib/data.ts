export type ItemStatus = "conferido" | "nao_cobrado" | "cobrado_sem_registro" | "divergente";
export interface AuditItem {
  item: string; tipo: "Material" | "Medicamento" | "Procedimento" | "Taxa";
  prontuario: number; conta: number; valorUnit: number; fonte: string;
}
export interface Case {
  id: string; paciente: string; procedimento: string; cirurgiao: string;
  convenio: string; data: string; itens: AuditItem[];
}
export const statusOf = (i: AuditItem): ItemStatus =>
  i.prontuario === i.conta ? "conferido"
  : i.conta === 0 ? "nao_cobrado"
  : i.prontuario === 0 ? "cobrado_sem_registro" : "divergente";
/** Receita não capturada: usado no prontuário e não cobrado (positivo). */
export const leakage = (i: AuditItem) => Math.max(0, i.prontuario - i.conta) * i.valorUnit;
/** Risco de glosa: cobrado além do registrado. */
export const glosaRisk = (i: AuditItem) => Math.max(0, i.conta - i.prontuario) * i.valorUnit;

export const cases: Case[] = [
  { id: "CX-10421", paciente: "M. A. Souza", procedimento: "Artroplastia total de joelho", cirurgiao: "Dr. Ribeiro", convenio: "Bradesco Saúde", data: "2026-11-20",
    itens: [
      { item: "Prótese joelho cimentada", tipo: "Material", prontuario: 1, conta: 1, valorUnit: 18400, fonte: "Descrição cirúrgica" },
      { item: "Cimento ósseo c/ antibiótico", tipo: "Material", prontuario: 2, conta: 1, valorUnit: 980, fonte: "Folha de sala" },
      { item: "Cefazolina 1g", tipo: "Medicamento", prontuario: 3, conta: 3, valorUnit: 42, fonte: "Prescrição" },
      { item: "Ácido tranexâmico 250mg", tipo: "Medicamento", prontuario: 4, conta: 0, valorUnit: 36, fonte: "Ficha anestésica" },
      { item: "Taxa de sala – porte 6", tipo: "Taxa", prontuario: 1, conta: 1, valorUnit: 3200, fonte: "Mapa cirúrgico" },
      { item: "Bomba de infusão (diária)", tipo: "Taxa", prontuario: 2, conta: 0, valorUnit: 180, fonte: "Evolução enfermagem" },
    ] },
  { id: "CX-10422", paciente: "J. P. Lima", procedimento: "Colecistectomia videolaparoscópica", cirurgiao: "Dra. Campos", convenio: "SulAmérica", data: "2026-11-20",
    itens: [
      { item: "Trocarte descartável 10mm", tipo: "Material", prontuario: 3, conta: 3, valorUnit: 420, fonte: "Folha de sala" },
      { item: "Clipador Hem-o-lok", tipo: "Material", prontuario: 1, conta: 2, valorUnit: 1150, fonte: "Folha de sala" },
      { item: "Fio Vicryl 2-0", tipo: "Material", prontuario: 2, conta: 2, valorUnit: 64, fonte: "Folha de sala" },
      { item: "Propofol 200mg", tipo: "Medicamento", prontuario: 2, conta: 2, valorUnit: 28, fonte: "Ficha anestésica" },
      { item: "Colangiografia intraoperatória", tipo: "Procedimento", prontuario: 1, conta: 0, valorUnit: 890, fonte: "Descrição cirúrgica" },
    ] },
  { id: "CX-10423", paciente: "R. C. Alves", procedimento: "Histerectomia total", cirurgiao: "Dr. Nogueira", convenio: "Amil", data: "2026-11-21",
    itens: [
      { item: "Selador vascular LigaSure", tipo: "Material", prontuario: 1, conta: 1, valorUnit: 5200, fonte: "Folha de sala" },
      { item: "Sonda vesical de demora", tipo: "Material", prontuario: 1, conta: 1, valorUnit: 38, fonte: "Evolução enfermagem" },
      { item: "Enoxaparina 40mg", tipo: "Medicamento", prontuario: 3, conta: 3, valorUnit: 55, fonte: "Prescrição" },
      { item: "Sala de recuperação (hora)", tipo: "Taxa", prontuario: 3, conta: 2, valorUnit: 260, fonte: "Registro RPA" },
    ] },
  { id: "CX-10424", paciente: "A. F. Costa", procedimento: "Hernioplastia inguinal", cirurgiao: "Dra. Campos", convenio: "Unimed", data: "2026-11-21",
    itens: [
      { item: "Tela de polipropileno", tipo: "Material", prontuario: 1, conta: 1, valorUnit: 640, fonte: "Descrição cirúrgica" },
      { item: "Bupivacaína 0,5%", tipo: "Medicamento", prontuario: 1, conta: 1, valorUnit: 22, fonte: "Ficha anestésica" },
      { item: "Taxa de sala – porte 3", tipo: "Taxa", prontuario: 1, conta: 1, valorUnit: 1400, fonte: "Mapa cirúrgico" },
    ] },
];

export type CancelMotivo = "Jejum inadequado" | "Exames pendentes" | "Autorização do convênio" | "Falta de material/OPME" | "Paciente faltou" | "Atraso de sala anterior";
export interface Surgery {
  sala: string; inicio: number; duracao: number; procedimento: string; paciente: string;
  checklist: { autorizacao: boolean; exames: boolean; opme: boolean; jejumConfirmado: boolean; consentimento: boolean };
}
export const checklistLabels: Record<keyof Surgery["checklist"], string> = {
  autorizacao: "Autorização", exames: "Exames pré-op", opme: "OPME", jejumConfirmado: "Jejum confirmado", consentimento: "Termo assinado",
};
export const riskScore = (s: Surgery) => {
  const w = { autorizacao: 35, opme: 25, exames: 20, jejumConfirmado: 12, consentimento: 8 };
  return (Object.keys(w) as (keyof typeof w)[]).reduce((a, k) => a + (s.checklist[k] ? 0 : w[k]), 0);
};
const ok = { autorizacao: true, exames: true, opme: true, jejumConfirmado: true, consentimento: true };
export const agenda: Surgery[] = [
  { sala: "Sala 1", inicio: 7, duracao: 2.5, procedimento: "Artroplastia de quadril", paciente: "L. Mendes", checklist: ok },
  { sala: "Sala 1", inicio: 10, duracao: 1.5, procedimento: "Artroscopia de joelho", paciente: "T. Rocha", checklist: { ...ok, opme: false } },
  { sala: "Sala 1", inicio: 13, duracao: 2, procedimento: "Fixação de rádio", paciente: "E. Pinto", checklist: ok },
  { sala: "Sala 2", inicio: 7, duracao: 1, procedimento: "Hernioplastia", paciente: "C. Duarte", checklist: ok },
  { sala: "Sala 2", inicio: 8.5, duracao: 1.5, procedimento: "Colecistectomia VLP", paciente: "B. Freitas", checklist: { ...ok, autorizacao: false, exames: false } },
  { sala: "Sala 2", inicio: 11, duracao: 1, procedimento: "Hernioplastia", paciente: "S. Moraes", checklist: { ...ok, jejumConfirmado: false } },
  { sala: "Sala 3", inicio: 7.5, duracao: 3, procedimento: "Histerectomia", paciente: "V. Lopes", checklist: ok },
  { sala: "Sala 3", inicio: 12, duracao: 1, procedimento: "Curetagem", paciente: "N. Barros", checklist: ok },
  { sala: "Sala 4", inicio: 7, duracao: 4, procedimento: "Revascularização miocárdica", paciente: "H. Teixeira", checklist: { ...ok, consentimento: false } },
];
export const SALA_JANELA = { inicio: 7, fim: 19 };
export const TURNOVER_H = 0.5;
export const cancelamentos: { motivo: CancelMotivo; qtd: number }[] = [
  { motivo: "Autorização do convênio", qtd: 14 }, { motivo: "Exames pendentes", qtd: 11 },
  { motivo: "Jejum inadequado", qtd: 7 }, { motivo: "Falta de material/OPME", qtd: 6 },
  { motivo: "Paciente faltou", qtd: 5 }, { motivo: "Atraso de sala anterior", qtd: 4 },
];
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
