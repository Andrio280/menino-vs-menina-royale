# Menino vs Menina Royale 2.0

Esta versão mantém a arena, personagens, torres e cores do protótipo original. Ela acrescenta:

- modo LIVE visual (`?mode=live`) que esconde os botões de teste;
- layout vertical responsivo para captura de navegador;
- conexão WebSocket com `ws://` ou `wss://` conforme o endereço;
- reconexão com espera progressiva e indicador de estado;
- fila de até 100 presentes durante a tela de vitória;
- validação de equipe/carta e limite do nome exibido;
- log de presentes sem inserir nomes de usuários via HTML;
- servidor com porta dinâmica, rota `/health`, limite de conexões e heartbeat;
- modo de demonstração com presentes fictícios.

## Rodar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run demo
```

Abra `http://localhost:8080` para testar com os botões e os presentes simulados pelo servidor.

Para visualizar a composição sem botões de teste, abra `http://localhost:8080/?mode=live`.

## Hospedagem

Configure o serviço para executar `npm start`. A plataforma deve instalar as dependências a partir de `package.json` e fornecer a variável `PORT`. Para testes com eventos fictícios, defina `DEMO=true` ou use o comando `npm run demo`.

A rota `/health` retorna o estado básico do serviço.

## Limites desta versão

Esta entrega é um protótipo de desenvolvimento. Ela não se conecta ao TikTok, não lê comentários e não recebe presentes reais. Os eventos usados no jogo são simulados para testar a arena, o placar, as cartas e as animações. A integração com plataformas externas exige revisão separada de permissões, regras, segurança e elegibilidade da conta.
