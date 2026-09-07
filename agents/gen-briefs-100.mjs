#!/usr/bin/env node
/**
 * Gera 100 briefings → briefings-100-2026.md + inbox.md + queue.md
 * Uso: node agents/gen-briefs-100.mjs
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const today = "2026-09-06";

const LINES = {
  A: ["Condições — evidência calibrada", "Hubs de doença/sintoma: claim com estudo nomeado, teto ≤ dados, Brasil 2026."],
  B: ["Acesso pós-1.015", "Jornada prática depois da RDC 1.015/2026 e 660/2022: farmácia, importação, plano, documentos."],
  C: ["Família e cuidado", "Quem convive com o paciente: idoso, gestação, trabalho, escola, efeitos a observar."],
  D: ["Moléculas e produto", "CBG/CBN/razões/vias/qualidade — educação, não vitrine nem dose."],
  E: ["Segurança farmacológica", "Interações específicas, efeitos adversos, mitos de overdose/psicose."],
  F: ["Regulação e direito", "Conselhos, Congresso, associações, comparação internacional — sem tutorial de cultivo ilegal."],
  G: ["Mitos e limpeza de SERP", "Queries hiperhólicas onde TSC ganha com sobriedade e fonte."],
  H: ["Profissional de saúde", "Prescritor/farmacêutico: fronteiras de ato, especialidade, telemedicina."],
};

/** @type {Array<[string,string,string,string,string,string,string,string,string,string?]>} */
const RAW = [
  ["A","P0","tese","Cannabis medicinal na fibromialgia: o que a evidência aguenta","cannabis fibromialgia","ciencia","A SBR não recomenda canabinoide de rotina; há ensaios/coortes com sinal em dor/sono — calibra hype × diretriz.","SERP mistura cura e clínicas; falta confronto com diretriz SBR.","Busca alta; diferencial TSC."],
  ["A","P0","tese","CBD e enxaqueca: o que os estudos sustentam","cbd enxaqueca","ciencia","Evidência limitada; diferenciar migrânea, tensional e abuso de analgésicos.","Pouca peça pt-BR com estudo nomeado.","Score KB alto; spoke de dor."],
  ["A","P0","tese","Cannabis medicinal e TEPT: evidência, risco e Brasil","cannabis medicinal tept","ciencia","Sinal em alguns estudos; risco de THC em vulneráveis; não é primeira linha.","SERP emocional sem mapa de evidência.","Query forte; hype de trauma."],
  ["A","P0","tese","Cannabis na doença de Crohn: sintoma, inflamação e limites","cannabis medicinal crohn","ciencia","Alívio sintomático ≠ cicatrização mucosal em RCTs grandes.","Concorrência lista cura; TSC separa desfechos.","DII com gap honesto."],
  ["A","P1","tese","Cannabis na colite ulcerativa: o que muda em relação ao Crohn","cannabis medicinal colite ulcerativa","ciencia","Spoke de DII; evidência ainda mais frágil — texto irmão, não cópia.","Ninguém diferencia Crohn × CU no SERP.","Cluster DII."],
  ["A","P0","tese","Cannabis medicinal e endometriose: dor e qualidade de vida","cannabis medicinal endometriose","ciencia","Dor pélvica com busca feminina alta; evidência preliminar; sem cura.","Clínicas e influencers dominam.","Audiência subatendida com rigor."],
  ["A","P1","tese","Cannabis na síndrome de Tourette: tiques e evidência","cannabis medicinal tourette","ciencia","Há sinal em estudos; teto baixo, sem dose.","SERP sensacionalista.","KB já sinalizou."],
  ["A","P0","tese","Cannabis medicinal e TDAH: o que a ciência (ainda) não fecha","cannabis medicinal tdah","ciencia","Hype + ensaio CBG em recrutamento; não alternativa automática a estimulante.","SERP promete foco.","Pais/jovens; sobriedade compete."],
  ["A","P1","tese","Cannabis e glaucoma: por que a evidência esfriou","cannabis medicinal glaucoma","ciencia","Redução transitória de PIO ≠ tratamento.","Mito residual.","Limpeza editorial."],
  ["A","P1","tese","Cannabis na artrite reumatoide: dor inflamatória e limites","cannabis medicinal artrite reumatoide","ciencia","Adjuvante possível; não substitui DMARD.","Poucas peças separam AR de osteoartrite.","Reumatologia."],
  ["A","P1","tese","Cannabis na osteoartrite: o que dá para esperar","cannabis medicinal osteoartrite","ciencia","Dor mecânica; evidência modesta.","SERP genérico artrite.","Prevalência alta."],
  ["A","P0","tese","Cannabis na dor neuropática: o que meta-análises mostram","cannabis medicinal dor neuropatica","ciencia","Sinal citado em revisões; NNT/NNH vs gabapentinoides.","Hub de dor genérico; spoke separado ranqueia.","Intenção alta."],
  ["A","P1","tese","Cannabis e neuropatia diabética: evidência e cuidado metabólico","cannabis neuropatia diabetica","ciencia","Spoke de neuropatia; polifarmácia.","Só clínicas particulares.","Prevalência BR."],
  ["A","P1","tese","Cannabis medicinal na ELA: sintoma, não modificador de doença","cannabis medicinal ela","ciencia","Espasticidade/saliva/sono possíveis; não altera progressão.","Stub KB genérico; hub limpo.","Sobriedade para família.","esclerose-lateral-amiotrofica-ela-sintomas-e-tratamentos"],
  ["A","P1","tese","Cannabis e síndrome do intestino irritável","cannabis medicinal intestino irritavel","ciencia","Dor visceral; evidência fraca a moderada.","SERP bem-estar.","Busca digestiva."],
  ["A","P1","tese","Náusea na quimioterapia e canabinoides: o que já é antigo e o que mudou","cannabis nausea quimioterapia","ciencia","Indicação clássica no mundo; no BR não é linha automática.","Pouca atualização pós-1.015.","Spoke paliativo."],
  ["A","P1","tese","Apetite, caquexia e cannabis: o que a evidência cobre","cannabis medicinal apetite","ciencia","THC ≠ CBD; contexto oncológico/HIV; sem emagrecer com CBD.","SERP contraditório.","Limpeza + paliativo."],
  ["A","P1","tese","Espasticidade e cannabis: além da esclerose múltipla","cannabis medicinal espasticidade","ciencia","EM tem mais dado; outras causas exigem teto menor.","Spoke separado do hub EM.","Cluster neurológico."],
  ["A","P0","tese","CBD e depressão: por que não é antidepressivo de prateleira","cbd depressao","ciencia","Evidência frágil; risco de abandonar tratamento eficaz.","Hype massivo.","Volume; diferencial TSC."],
  ["A","P1","tese","THC, psicose e esquizofrenia: o mapa de risco","thc psicose risco","ciencia","Dose, idade de início, vulnerabilidade; medicinal não zera risco.","Alarmismo ou negação.","Segurança."],
  ["A","P1","tese","Síndrome de Dravet e CBD: o que o Epidiolex ensinou","sindrome de dravet cbd","ciencia","Spoke de epilepsia com RCT; acesso BR ≠ label FDA.","Famílias buscam o nome.","Cluster epilepsia."],
  ["A","P1","tese","Lennox-Gastaut e canabidiol: evidência e acesso no Brasil","lennox-gastaut cbd","ciencia","Segundo spoke nomeado de epilepsia refratária.","SERP genérico.","Cluster epilepsia."],
  ["A","P1","tese","Cannabis e psoríase: pele, inflamação e hype tópico","cannabis medicinal psoriase","ciencia","Tópico ≠ sistêmico; evidência limitada.","SERP cosmético.","Dermatologia."],
  ["A","P1","tese","Cannabis em HIV/Aids: sintoma, apetite e interações","cannabis medicinal hiv","ciencia","Uso sintomático; interações com antirretrovirais.","Pouca atualização BR.","Segurança + condição."],
  ["A","P1","tese","Cannabis na espondilite anquilosante e dor axial","cannabis medicinal espondilite","ciencia","Adjuvante de dor; não substitui anti-TNF.","Hub limpo no lugar de clipping.","Reumatologia."],
  ["A","P1","tese","Cannabis na menopausa: fogacho, sono e humor","cannabis medicinal menopausa","ciencia","Busca feminina; evidência preliminar; não substitui TRH quando indicada.","SERP wellness.","Audiência 2026."],
  ["A","P1","tese","SOP e cannabis: o que não misturar com marketing hormonal","cannabis medicinal sop","ciencia","Só evidência canábica (ou ausência) + cuidado metabólico.","Ruído na esteira.","Saúde da mulher.","sindrome-dos-ovarios-policisticos-sintomas-causas-e-tratamentos-para-con"],
  ["A","P2","tese","Cannabis e TOC: o que existe além de relato","cannabis medicinal toc","ciencia","Literatura escassa; não substituir exposição/ISRS.","Cauda.","Cluster psiquiatria."],
  ["A","P1","tese","Esclerose tuberosa e crises: onde o CBD entra","esclerose tuberosa cbd","ciencia","Indicação com evidência em alguns rótulos internacionais; mapear BR.","Cauda clínica.","Cluster epilepsia."],
  ["A","P2","tese","Neuralgia pós-herpética e canabinoides","cannabis neuralgia pos-herpetica","ciencia","Spoke de dor neuropática com query própria.","Cauda.","Cluster dor."],
  ["B","P0","tese","Plano de saúde e cannabis medicinal: cobertura e negativa","cannabis medicinal plano de saude","regulacao","Spoke do hub SUS: rol, judicialização, negativas típicas.","SERP de escritório.","Intenção pós-receita."],
  ["B","P0","tese","O que é uma associação canábica no Brasil (e o que não é)","associacao cannabica","informe","Associativo ≠ farmácia ≠ importação.","Confusão no Instagram.","Keyword clássica."],
  ["B","P1","tese","TCLE na cannabis medicinal: o que o paciente assina","tcle cannabis medicinal","informe","Consentimento pós-1.015 na farmácia e no consultório.","Ninguém explica o documento.","Spoke receita."],
  ["B","P0","tese","Como ler a lista de produtos de Cannabis autorizados pela Anvisa","produtos cannabis autorizados anvisa","informe","AS ≠ registro de medicamento; como checar.","gov.br ilegível.","Confiança."],
  ["B","P0","recencia","Farmácia de manipulação e CBD: o que a 1.015 permite — e o que ainda falta","manipulacao cbd farmacia","regulacao","Norma complementar: status 2026 sem inventar vigência.","Lacuna #29.","Recência crítica.","manipulacao-em-farmacia-o-que-a-regra-nova-permite"],
  ["B","P1","tese","Renovação da autorização Anvisa para importação: prazos e armadilhas","renovacao autorizacao anvisa cannabis","informe","Validade e armadilhas com a 660 vigente.","Tutoriais velhos.","Jornada."],
  ["B","P0","tese","RDC 660 ainda vale? Importação por pessoa física em 2026","rdc 660 cannabis","regulacao","1.015 ≠ 660; PF segue 660 até norma nova.","Confusão pós-imprensa.","Canônico TSC."],
  ["B","P0","tese","Autorização sanitária vs medicamento registrado: a diferença que muda a conversa","autorizacao sanitaria cannabis","informe","Produto sob AS não é medicamento de registro clássico.","Troca de termos.","GEO."],
  ["B","P1","tese","Onde comprar CBD legal no Brasil (sem cair em golpe)","onde comprar cbd legal brasil","informe","Farmácia AS, importação, associação — checklist.","SERP afiliado.","Educação."],
  ["B","P1","tese","Viajar de avião com cannabis medicinal no Brasil","viajar aviao cannabis medicinal","informe","Receita, laudo, quantidade; doméstico vs internacional.","Só fóruns.","Jornada."],
  ["B","P1","tese","Receita digital de cannabis: o que já roda e o que trava","receita digital cannabis medicinal","informe","Eletrônica × notificação especial.","Spoke receita.","2026 digital."],
  ["B","P1","tese","Telemedicina e cannabis medicinal no Brasil: limites","telemedicina cannabis medicinal","regulacao","Remoto ≠ receita liberada sempre.","Clínicas vendem atalho.","Acesso."],
  ["B","P1","tese","Programas estaduais de cannabis medicinal: o mapa (sem fingir cobertura nacional)","programa estadual cannabis medicinal","regulacao","Estado ≠ SUS federal; só verificável.","Projeto político misturado.","Spoke SUS."],
  ["B","P1","tese","CBD na farmácia de rua: o que muda depois de maio/2026","cbd farmacia 2026","informe","Dispensação 1.015: receita, TCLE, THC.","Imprensa genérica.","Recência."],
  ["B","P1","tese","Diferença entre óleo de associação, manipulado e industrializado","oleo cannabis associacao vs farmacia","informe","Três vias, três lógicas de qualidade/preço.","Compara errado.","Acesso/produto."],
  ["B","P2","tese","Laudo e relatório médico para Anvisa: o que costuma faltar","laudo medico anvisa cannabis","informe","Checklist — sem modelo fraudulento.","Tutoriais perigosos.","Autorização."],
  ["B","P2","tese","Prazo e logística da importação de cannabis medicinal","prazo importacao cannabis medicinal","informe","Faixas realistas; variáveis Anvisa/correio.","Promessa de 7 dias.","Spoke importação."],
  ["C","P0","tese","Cannabis medicinal em idosos: risco, benefício e polifarmácia","cannabis medicinal idosos","ciencia","Quedas, sedação, interações; teto baixo.","SERP otimista.","Demografia."],
  ["C","P0","tese","Gravidez, lactação e cannabis: o que a norma e a evidência dizem","cannabis medicinal gravidez","ciencia","Contraindicação THC>0,2% e prudência; sem relativizar.","Influencer natural.","Segurança dura."],
  ["C","P1","tese","Adolescente e cannabis medicinal: critérios e red flags","cannabis medicinal adolescente","ciencia","Neurodesenvolvimento e THC.","Atalho para ansiedade escolar.","Família."],
  ["C","P1","tese","O que o cuidador deve observar nos primeiros 30 dias","cuidador cannabis medicinal efeitos","informe","Sonolência, interação, quando ligar — sem dose.","Falta spoke prático.","Cuidado."],
  ["C","P0","tese","Dirigir sob tratamento com cannabis medicinal","dirigir cannabis medicinal","informe","TCLE e sedação; trânsito × uso medicinal.","Dúvida universal.","Prático."],
  ["C","P1","tese","Trabalho, exame toxicológico e cannabis medicinal","exame toxicologico cannabis medicinal","regulacao","Laudo não apaga metabólito.","Pânico.","Vida real."],
  ["C","P1","tese","Quando a família rejeita o tratamento: como conversar sem sermonário","familia rejeita cannabis medicinal","informe","Spoke emocional do hub família.","Tom TSC.","Família."],
  ["C","P1","tese","Dependência de cannabis vs uso medicinal: fronteiras honestas","dependencia cannabis uso medicinal","ciencia","Transtorno por uso × adesão; alertas.","Polarização.","Credibilidade."],
  ["C","P1","tese","Cannabis medicinal e sexualidade: o que há de dado (e de mito)","cannabis medicinal sexualidade","ciencia","Libido/dor pélvica — teto baixo.","Clickbait.","Saúde íntima."],
  ["C","P2","tese","Síndrome de abstinência canabinoide: existe e como aparece","abstinencia cannabis sintomas","ciencia","Sintomas e tempo.","Subestimado.","Segurança."],
  ["D","P0","tese","O que é CBG (canabigerol)","o que é cbg","informe","Molécula, pesquisa, status BR — sem milagre.","Só CBD/THC no ar.","Porta."],
  ["D","P0","tese","O que é CBN (canabinol)","o que é cbn","informe","Sono é marketing até prova.","Hype insônia.","Par CBG."],
  ["D","P1","tese","O que é CBC e por que aparece no laudo","o que é cbc canabichromeno","informe","Menor; não vender efeito.","Cauda COA.","Produto."],
  ["D","P0","tese","Efeito entourage: o que a evidência aguenta","efeito entourage cannabis","ciencia","Hipótese ≠ dogma.","Slogan de marca.","Hub."],
  ["D","P0","tese","Razões THC:CBD — o que significam na prática (sem dose)","razao thc cbd","informe","1:1, CBD-dominante, THC-dominante e regra 0,2%.","SERP de loja.","Produto."],
  ["D","P1","tese","Delta-8, delta-9 e análogos: o que importa no Brasil","delta-8 thc brasil","regulacao","Delta-9 no eixo; semi-sintéticos = risco.","Moda EUA.","Regulação."],
  ["D","P1","tese","Terpenos na cannabis medicinal: aroma ou terapêutica?","terpenos cannabis medicinal","ciencia","Educação; sem perfil que cura.","Marketing.","Produto."],
  ["D","P1","tese","Vaporização medicinal vs combustão: diferença que importa","vaporizacao cannabis medicinal","informe","Inalatório prescrito ≠ fumar.","Confusão.","Vias."],
  ["D","P1","tese","CBD tópico: pele, dor local e o que não esperar","cbd topico","ciencia","Permeação limitada; cosmético ≠ AS.","Creme milagre.","Produto."],
  ["D","P1","tese","Cápsula vs óleo de CBD: critérios de escolha (sem posologia)","capsula ou oleo cbd","informe","Absorção e praticidade; receita manda.","Spoke vias.","Produto."],
  ["D","P1","tese","Flor de cannabis medicinal no Brasil: o que a regra permite","flor cannabis medicinal brasil","regulacao","AS/importação; zero tutorial de cultivo.","Busca perigosa.","Regulação."],
  ["D","P0","tese","HHC, THCP e canabinoides de laboratório: risco no mercado paralelo","hhc thcp risco brasil","informe","Fora da Anvisa; adulteração.","TikTok.","Golpes 2.0."],
  ["E","P0","tese","Efeitos colaterais do CBD: o que aparece nos estudos","efeitos colaterais cbd","ciencia","Sonolência, GI, enzimas; dose-estudo ≠ Instagram.","SERP minimiza.","Segurança."],
  ["E","P0","tese","Contraindicações do canabidiol: mapa sóbrio","contraindicacoes canabidiol","ciencia","Gestação, alergia, interações, psicose.","Listas inventadas.","Query direta."],
  ["E","P1","tese","CBD e anticoagulantes (warfarina e afins)","cbd warfarina","ciencia","Spoke CYP clássico.","Medo concreto.","Segurança."],
  ["E","P1","tese","CBD e antidepressivos: o que monitorar","cbd antidepressivos interacao","ciencia","Spoke interação.","Psiquiatria comum.","Segurança."],
  ["E","P1","tese","CBD e álcool: soma de sedação","cbd e alcool","informe","Depressão de SNC.","Pergunta cotidiana.","Prático."],
  ["E","P0","tese","Síndrome de hiperemese canabinoide: o que é","sindrome hiperemese canabinoide","ciencia","Vômito cíclico + banho quente; THC crônico.","Subdiagnosticada.","Urgência."],
  ["E","P1","tese","Dá para ter overdose de CBD? O que a toxicologia diz","overdose cbd","ciencia","Janela ampla ≠ inocuidade.","Mito.","Limpeza."],
  ["E","P1","tese","Tolerância a canabinoides: o que acontece com o tempo","tolerancia cannabis medicinal","ciencia","Fenômeno real; manejo médico.","Fóruns.","Adesão."],
  ["F","P0","tese","CFM e cannabis medicinal: o que a resolução realmente diz","cfm cannabis medicinal","regulacao","O que o conselho autoriza/restringe.","SERP advocacia.","Prescrição."],
  ["F","P1","tese","CFF e dispensação de cannabis na farmácia","cff cannabis dispensacao","regulacao","Papel do farmacêutico pós-1.015.","Falta âncora.","Acesso."],
  ["F","P1","tese","Associações e o marco regulatório 2026: o que vigora","rdc associacao cannabis 2026","regulacao","Só com norma/URL; senão a confirmar.","Imprensa confusa.","Recência."],
  ["F","P1","tese","Projetos de lei de cannabis no Congresso: o que importa em 2026","projeto de lei cannabis brasil 2026","regulacao","Status verificável; sem clipping semanal.","Ruído político.","Radar."],
  ["F","P0","tese","Descriminalização do porte × cannabis medicinal: não são a mesma luta","descriminalizacao vs cannabis medicinal","analise","Separar eixos paciente × recreativo.","Confusão pública.","Tese TSC."],
  ["F","P1","tese","Cannabis veterinária: o que Anvisa/MAPA já fecharam","cannabis medicinal veterinaria","regulacao","Hub vet limpo (KB inchada).","Demanda pet.","Regulação."],
  ["F","P1","tese","Portugal, Uruguai e Canadá: o que dá para comparar com o Brasil","cannabis medicinal brasil comparacao internacional","analise","Acesso/regulação sem copie o modelo.","SERP superficial.","Contexto."],
  ["F","P1","tese","Habeas corpus e cultivo medicinal: o que o paciente precisa entender (sem tutorial)","habeas corpus cultivo medicinal","regulacao","Jurisprudência × risco; zero how-to.","Escritórios.","Direito.","stj-habeas-corpus-cannabis"],
  ["G","P0","tese","Lista de doenças tratadas com CBD: como ler sem se enganar","lista doencas cbd","informe","Anvisa não tem lista mágica; off-label graduado.","Listas de 30 doenças.","Âncora anti-hype."],
  ["G","P1","tese","CBD emagrece ou engorda? O que os dados mostram","cbd emagrece","ciencia","Desfazer clickbait; THC × CBD.","Volume + lixo.","Limpeza."],
  ["G","P1","tese","CBD vicia? Dependência e canabidiol","cbd vicia","ciencia","CBD ≠ THC no abuso; nuance.","Pergunta de porta.","Limpeza."],
  ["G","P1","tese","Óleo de CBD caseiro: por que é má ideia","oleo cbd caseiro","informe","Contaminantes e ilegalidade — sem receita.","TikTok.","Segurança."],
  ["G","P1","tese","Sativa vs indica no uso medicinal: o que sobra de útil","sativa indica medicinal","informe","Quimiotipo > folclore.","Mito eterno.","Produto.","tipos-de-cannabis-sativa-indica-ruderalis-e-hibridas"],
  ["G","P1","tese","CBD sem THC no rótulo: o que isso garante de verdade","cbd sem thc","informe","Limite analítico, full spectrum, COA.","Marketing.","Qualidade."],
  ["G","P1","tese","Canabidiol na comida e bebida: status legal no Brasil","cbd alimento brasil","regulacao","Não é suplemento liberado.","Import fashion.","Regulação."],
  ["G","P1","tese","Teste toxicológico e CBD: o que exames mostram","teste toxicologico cbd","informe","Imunoensaio e THC.","Spoke trabalho.","Prático."],
  ["H","P0","tese","Dentista e cannabis medicinal: o que a 1.015 mudou","dentista cannabis medicinal","regulacao","Prescrição odontológica sob norma.","Clipping KB.","Prescritor.","a-nova-odontologia-e-a-cannabis-medicinal"],
  ["H","P1","tese","Farmacêutico e cannabis: dispensação, orientação e responsabilidade","farmaceutico cannabis medicinal","regulacao","Ato farmacêutico na AS.","Falta peça.","Profissional."],
  ["H","P1","tese","Psiquiatria e cannabis: quando faz sentido discutir","psiquiatra cannabis medicinal","ciencia","Ansiedade/TEPT/risco psicose — clínica, não moda.","Clínicas genéricas.","Prescritor."],
  ["H","P1","tese","Como o prescritor documenta off-label de cannabis","prescricao off-label cannabis","regulacao","Prontuário, TCLE, evidência — sem receita fraudulenta.","Cursos-atalho.","Prescritor."],
  ["H","P1","tese","Médico veterinário e CBD: caminho regulatório em 2026","medico veterinario cbd","regulacao","CFMV/MAPA.","Demanda pet.","Profissional."],
  ["H","P2","tese","Enfermagem e cannabis medicinal: papel no cuidado","enfermagem cannabis medicinal","informe","Adesão e educação; não é prescrição.","Cauda equipe.","Cuidado."],
  ["G","P1","tese","Broad spectrum CBD: o que muda frente a full e isolado","cbd broad spectrum","informe","Spoke do hub full vs isolado; três termos, uma confusão.","Marketing de rótulo.","Produto."],
];

if (RAW.length !== 100) {
  console.error(`Esperado 100, veio ${RAW.length}`);
  process.exit(1);
}

const briefs = RAW.map((row) => {
  const [line, priority, origin, topic, keyword, type, takeaway, gap, why, cannibal = "none"] = row;
  return { line, priority, origin, topic, keyword, type, channel: "blog", takeaway, gap, why, cannibal, seo_timing: "before", intent: "informacional", author: "Redação Tudo Sobre Cannabis", action: "criar" };
});

const kws = briefs.map((b) => b.keyword);
const dup = kws.filter((k, i) => kws.indexOf(k) !== i);
if (dup.length) {
  console.error("Keywords duplicadas:", [...new Set(dup)]);
  process.exit(1);
}

const byLine = {};
const byPri = {};
for (const b of briefs) {
  byLine[b.line] = (byLine[b.line] || 0) + 1;
  byPri[b.priority] = (byPri[b.priority] || 0) + 1;
}

let md = `# 100 briefings — lote revisão Esteira (${today})

Origem: KB (\`library-hubs.yaml\`), fila histórica, gaps vs ledger #1–#59, temas clínicos/regulatórios relevantes em 2026.

Sem GSC real: prioridade = audiência BR × gap de SERP × diferencial TSC (evidência nomeada, RDC vigente, sem dose).

**Uso:** checar na Esteira (Inbox + Fila). Enfileirar aprovados; matar canibais. Sem \`reviewedBy\` não publica.

## Linhas editoriais (reutilizáveis)

`;

for (const [lid, [name, desc]] of Object.entries(LINES)) {
  md += `### ${lid} — ${name} (${byLine[lid] || 0} peças)\n\n${desc}\n\nCritério de peça nova: keyword própria, takeaway ≤ evidência, \`cannibal\` checado.\n\n`;
}

md += `## Já cobertos / não repetir agora

Epilepsia hub, como começar, CBD, THC, autorização, RDC 1.015, receita, ansiedade, dor crônica, insônia, importação, interação CYP, custo, quem prescreve, SUS hub, autismo, câncer paliativo, EM, criança, full spectrum, COA, explicar à família, golpe, óleo como tomar, 1ª consulta, RDC 327, endocanabinoide, STJ hub, Alzheimer/Parkinson (reescrever — não duplicar).

## Índice por prioridade

`;

for (const pri of ["P0", "P1", "P2"]) {
  md += `\n### ${pri} (${byPri[pri] || 0})\n\n`;
  briefs.forEach((b, i) => {
    if (b.priority === pri) md += `- **B${String(i + 1).padStart(3, "0")}** \`${b.keyword}\` — ${b.topic}\n`;
  });
}

md += `\n## Os 100 briefs (YAML)\n\n`;

briefs.forEach((b, i) => {
  const id = `B${String(i + 1).padStart(3, "0")}`;
  md += `### ${id} · ${LINES[b.line][0]} · ${b.priority}\n\n\`\`\`yaml\n`;
  md += `- id: "${id}"\n`;
  md += `  priority: ${b.priority}\n`;
  md += `  action: criar\n`;
  md += `  origin: ${b.origin}\n`;
  md += `  seo_timing: ${b.seo_timing}\n`;
  md += `  topic: "${b.topic}"\n`;
  md += `  keyword: "${b.keyword}"\n`;
  md += `  intent: ${b.intent}\n`;
  md += `  type: ${b.type}\n`;
  md += `  channel: blog\n`;
  md += `  author: ${b.author}\n`;
  md += `  line: ${b.line}\n`;
  md += `  takeaway: "${b.takeaway}"\n`;
  md += `  gap: "${b.gap}"\n`;
  md += `  cannibal: ${b.cannibal}\n`;
  md += `  why: "${b.why}"\n`;
  md += `\`\`\`\n\n`;
});

writeFileSync(join(root, "content/opportunities/briefings-100-2026.md"), md, "utf8");
writeFileSync(join(root, "content/opportunities/briefings-100-2026.json"), JSON.stringify(briefs, null, 2) + "\n", "utf8");

let inbox = `# Inbox editorial

# Lote 100 briefings (${today}) — revisar na Esteira.
# Detalhe: content/opportunities/briefings-100-2026.md

`;

briefs.forEach((b, i) => {
  const id = `B${String(i + 1).padStart(3, "0")}`;
  const note = `[${id}|${b.priority}|linha ${b.line}|kw: ${b.keyword}] ${b.takeaway.slice(0, 140)}`;
  inbox += `- topic: "${b.topic}"\n`;
  inbox += `  origin: ${b.origin}\n`;
  inbox += `  type: ${b.type}\n`;
  inbox += `  channel: blog\n`;
  inbox += `  note: "${note.replace(/"/g, "'")}"\n`;
  inbox += `  flagged_by: humano\n\n`;
});

writeFileSync(join(root, "content/opportunities/inbox.md"), inbox, "utf8");

let queue = `# Fila — Tudo Sobre Cannabis

Atualizado: ${today}

Lote humano **100 briefings** (\`briefings-100-2026.md\`). Sem GSC real.
Peças #1–#32 já na esteira/gate: **não recriar**. Alzheimer/Parkinson: reescrever runs existentes.

## P0–P2 — lote 100 (revisão Esteira)

| Prioridade | Ação | Origem | Tópico | Keyword | Type | Canal | Por quê |
|---|---|---|---|---|---|---|---|
`;

for (const b of briefs) {
  const why = `Linha ${b.line}: ${b.why}`.slice(0, 100);
  queue += `| ${b.priority} | criar | ${b.origin} | ${b.topic} | ${b.keyword} | ${b.type} | blog | ${why} |\n`;
}

queue += `
## Keywords

- Locked/em gate: \`taxonomy.json\` + ledger #1–#32
- Este lote: keyword candidata (travar no editor de canal se o texto responder)
- Reordenar quando existir \`search-console.json\`

## Executar

\`\`\`bash
npm run esteira
npm run agent -- --id <n>
\`\`\`
`;

writeFileSync(join(root, "content/opportunities/queue.md"), queue, "utf8");

console.log("OK 100 briefs");
console.log("by line", byLine);
console.log("by pri", byPri);
console.log("→ content/opportunities/briefings-100-2026.md");
console.log("→ content/opportunities/inbox.md");
console.log("→ content/opportunities/queue.md");
