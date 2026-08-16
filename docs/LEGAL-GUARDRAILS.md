# Guardrails jurídicos e clínicos

Conteúdo de saúde no Brasil. Erro aqui não é “SEO ruim”: é risco sanitário, ético e reputacional.

## O que este site é

Informação jornalístico-educacional sobre cannabis medicinal, regulação e evidência.

## O que este site não é

- Consulta, prescrição, indicação de produto ou dose
- Propaganda de medicamento (anúncios de canabidiol seguem regra sanitária; copy editorial não pode imitar anúncio)
- Incentivo a cultivo, extração, comércio ou importação irregular
- Promessa de cura

## Obrigações de cada peça

1. Disclaimer visível (rodapé do artigo + página /sobre): não substitui avaliação médica.
2. Claim terapêutico → estudo ou bula/RDC nomeados. Sem fonte, o claim sai.
3. Populações vulneráveis (criança, gestante, TEA, idoso): linguagem sóbria, sem anedota milagrosa.
4. Efeitos adversos e interações não são opcionais em textos de produto/via.
5. Atualização quando mudar RDC, resolução CFM/CFF ou retratação de paper citado.
6. Imagens de produto sem marca, sem “antes e depois”, sem menor de idade.

## Fontes

Só entra o que está em `content/sources.json` (allowlist). Paper: PubMed/DOI. Norma: site oficial. Mercado: relatório com ano.

Proibido como fonte primária: Instagram, Telegram, fórum de cultivo, blog de loja, Wikipedia como única base, paper predatório.

## Gate humano (obrigatório para publish)

Checklist em `agents/gates/publish.md`. Sem nome de revisor no frontmatter (`reviewedBy`), o runner recusa copiar para `content/published`.

## Publicidade e afiliados

No dia 1: **zero** link de afiliado de óleo. Diretório de serviços, se existir, é rotulado e auditado. Conteúdo pago, se um dia existir, leva rótulo `patrocinado` e não entra no cluster orgânico como se fosse editorial.

## Cultivo e recreativo

Fora de pauta. Se o leitor perguntar no futuro, a resposta editorial é o enquadramento legal vigente — não o tutorial.
