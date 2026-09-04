# Guardrails jurídicos e clínicos

Conteúdo de saúde, política de drogas e mercado no Brasil. Erro aqui não é “SEO ruim”: é risco sanitário, ético e reputacional.

## O que este veículo é

Editorial: ciência, medicina, regulação, economia, política e cultura da cannabis. Inclui crítica institucional, mercado e debate sobre proibição.

## O que este veículo não é

- Consulta, prescrição, indicação de produto ou dose
- Propaganda de medicamento
- Tutorial de cultivo, extração, comércio ou importação irregular
- Promessa de cura
- Texto corporativo da indústria

Cultivo como **política pública** (marco legal, Anvisa, Congresso) entra. O how-to não.

## Obrigações de cada peça

1. Disclaimer no Blog quando o texto discute tratamento (rodapé + /sobre). Newsletter e opinião: o rigor factual continua; o tom de bula não.
2. Claim terapêutico → estudo ou norma nomeados. Sem fonte, o claim sai.
3. Populações vulneráveis: sobriedade. Ironia não aponta para paciente ou sofrimento.
4. Efeitos adversos e interações não são opcionais em textos de produto/via.
5. Atualizar quando mudar RDC, resolução ou retratação de paper.
6. Distinguir o que a fonte afirma do que se verificou.

## Fontes

Allowlist em `content/sources.json`. Paper: PubMed/DOI. Norma: DOU / site oficial. Mercado: quem mediu, ano, método.

Imprensa nacional (G1, Folha, Estadão, CNN, etc.) pode ser citada **com link** quando o brief trouxer `source_url` e `cite: true`. Continua secundária: claim terapêutico e norma exigem primária. Portais setoriais Cannabis & Saúde e Sechat **não** entram no HTML público.

Proibido como primária: Instagram, Telegram, fórum de cultivo, blog de loja, Wikipedia sozinha, paper predatório, release sem checagem.

## Gate humano

`agents/gates/publish.md`. Sem `reviewedBy`, não publica.

## Publicidade

Zero afiliado de óleo no dia 1. Conteúdo pago, se existir, leva rótulo e não se mistura ao editorial.
