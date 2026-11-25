<!--
Título: Conventional Commits em inglês: `feat(intent): …`, `fix(speech): …`.
Escreva para quem vai revisar sem ter acompanhado a conversa. Seção que não se
aplica fica com "Nada." em vez de sumir: assim fica claro que ela foi pensada.
Estes comentários não aparecem no PR.
-->

## Por quê

<!-- O problema ou a necessidade, do ponto de vista de quem pergunta à Alexa
pelo dia litúrgico. Link para a issue ou a conversa. -->

## O que muda

<!-- O que a pessoa passa a poder pedir ou ouvir de diferente: frase,
resposta, idioma. Lista curta; o diff já mostra o código. -->

## Como foi feito

<!-- O que o diff não explica: a abordagem, o que foi descartado e por quê, os
arquivos que valem ser lidos primeiro. -->

## Riscos

<!--
Uma linha por risco: o que pode dar errado, quem sente, e o que segura. Pense
em:
- o contrato com a estevao-api: rota, livro de oração, data e fuso de quem
  pergunta;
- o que a voz lê: nome litúrgico, referência bíblica, número, abreviação;
- a chave da API e qualquer credencial da conta da Amazon;
- mudança que exige nova certificação da skill;
- carga e custo: chamadas à API por pergunta.
Se não há risco que valha nomear, diga por quê.
-->

## Publicação

<!--
Hoje nada é publicado a partir deste repositório. Se este PR muda o que a
skill faz, diga em ordem o que precisa acontecer fora do merge: onde a
resposta roda, o que muda no console da Alexa (modelo de interação,
manifesto, idiomas) e se pede nova certificação.
-->

- [ ] Nada a publicar.

## Como desfazer

<!-- Reverter o merge basta? Diga o que não volta: versão da skill já
certificada e publicada, que só muda com outra certificação. -->

## Como testar

<!-- O que foi rodado, com o resultado, e as frases testadas, com o que a
Alexa respondeu (livro, data, idioma). -->

## Relacionados

<!-- PRs em outros repositórios (`dodopok/estevao-api#123`) e issues. -->

## Checklist

- [ ] O que foi rodado está em "Como testar", com o resultado
- [ ] Resposta conferida com a da estevao-api para o mesmo livro e data
- [ ] Nenhuma chave, token ou credencial no diff
- [ ] Fala curta, sem markdown, com referências e números escritos para serem ouvidos
- [ ] Mudança que pede nova certificação dita em "Publicação"
- [ ] README diz o que a skill faz e como publicá-la
