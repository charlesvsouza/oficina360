# 01 - Status Atual do Sistema (Oficina360)

Data: 2026-04-28
Branch: master

## Situacao Geral
- Backend e frontend ativos em arquitetura separada.
- Modulo de estoque com regra de plano PRO/REDE e controle de permissao por perfil.
- Fluxo de cadastro de pecas ajustado para exibir erros ao usuario.

## Ajustes Aplicados Nesta Atualizacao
- Backend: endpoints de escrita de estoque agora exigem plano PRO.
  - POST /inventory/parts
  - PATCH /inventory/parts/:id
  - DELETE /inventory/parts/:id
  - POST /inventory/movements
- Frontend: tela de estoque passa a:
  - Exibir mensagem de erro quando falhar carregamento da lista.
  - Exibir alerta com mensagem da API ao falhar salvar peca.
  - Bloquear botao "Nova Peca" para usuarios sem permissao ou sem plano elegivel.

## Causa do Problema Identificada
- O cadastro podia falhar por permissao/plano sem feedback visual claro.
- Em alguns cenarios, o usuario percebia como "nao salvou" porque o erro ficava apenas no console.

## Arquivos Alterados
- backend/src/inventory/inventory.controller.ts
- frontend/src/pages/InventoryPage.tsx

## Proximos Arquivos de Acompanhamento
- 02_STATUS_SISTEMA.md
- 03_STATUS_SISTEMA.md
- 04_STATUS_SISTEMA.md

## Observacoes
- Recomendado manter este padrao numerico crescente para historico de evolucao.
