# Hostel Bryan Tatuapé - TODO

## Fase 1: Arquitetura e Design
- [x] Definir paleta de cores elegante e sofisticada
- [x] Escolher tipografia refinada
- [x] Criar estrutura de layout responsivo
- [x] Planejar estrutura de dados (tabelas, relacionamentos)

## Fase 2: Banco de Dados
- [x] Criar tabela de quartos (rooms)
- [x] Criar tabela de camas (beds)
- [x] Criar tabela de reservas (bookings)
- [x] Criar tabela de hóspedes (guests)
- [x] Executar migrações SQL

## Fase 3: Backend (tRPC Procedures)
- [x] Criar procedures para listar quartos e disponibilidade
- [x] Criar procedure para criar reserva
- [x] Criar procedure para listar reservas (admin)
- [x] Criar procedure para atualizar status de reserva
- [x] Implementar notificação ao dono via email

## Fase 4: Landing Page
- [x] Criar header com navegação
- [x] Implementar seção hero com informações principais
- [x] Adicionar mapa interativo com localização
- [x] Criar seção de comodidades
- [x] Implementar galeria de fotos
- [x] Adicionar rodapé com contato
- [x] Estilizar com design elegante e sofisticado

## Fase 5: Formulário de Reserva
- [x] Criar componente de seleção de datas (date picker)
- [x] Implementar seleção de quarto e número de hóspedes
- [x] Criar formulário com dados do hóspede (nome, email, telefone, CPF)
- [x] Implementar cálculo automático de preço
- [x] Validar formulário e enviar reserva
- [x] Exibir código de confirmação após sucesso

## Fase 6: Painel Administrativo
- [x] Criar layout do painel admin com sidebar
- [x] Listar todas as reservas com detalhes
- [x] Implementar filtros por data, status e hóspede
- [x] Criar modal para visualizar detalhes completos
- [x] Implementar ações (confirmar, cancelar, check-in, check-out)
- [x] Adicionar dashboard com estatísticas (total de reservas, receita, ocupação)

## Fase 7: Notificações
- [x] Configurar integração com email (notifyOwner)
- [x] Implementar template de email com detalhes
- [x] Enviar notificação ao confirmar reserva
- [x] Incluir detalhes do hóspede (nome, email, telefone)
- [x] Incluir detalhes do quarto e datas
- [x] Incluir código de confirmação na notificação

## Fase 8: Testes e Entrega
- [x] Testar fluxo completo de reserva
- [x] Testar painel administrativo
- [x] Testar responsividade em mobile
- [x] Validar notificações por email
- [x] Criar checkpoint final


## Fase 9: Atualizar Informações e Adicionar Fotos dos Quartos
- [x] Atualizar informações de contato (telefone, endereço, CEP)
- [x] Adicionar campo de URL de foto para cada quarto
- [x] Criar página de gerenciamento de fotos dos quartos no admin
- [x] Implementar upload de fotos via painel admin
- [x] Criar 7 quartos no banco de dados com preços e descrições
- [x] Exibir fotos dos quartos na página de reserva
- [x] Exibir fotos dos quartos na galeria da landing page

## Fase 10: Adicionar Desconto, Limpeza e Notificação WhatsApp
- [x] Adicionar opção de escolher diária de casal ou individual
- [x] Implementar desconto de 12% para uma pessoa
- [x] Adicionar taxa de limpeza única (R$ 7,00)
- [x] Integrar envio de confirmação via WhatsApp
- [x] Atualizar cálculo de preço com desconto e limpeza
- [x] Exibir resumo com desconto e limpeza no formulário

## Fase 11: Integração Real de WhatsApp e Testes
- [x] Integrar galeria da landing page com fotos reais dos quartos
- [x] Criar testes Vitest para cálculo de preço com desconto
- [x] Ajustar lógica de desconto para usar dailyType consistentemente
- [x] Validar fluxo completo de reserva com desconto e limpeza
- [x] Integrar API real de WhatsApp (Twilio ou WhatsApp Cloud API)
- [x] Criar testes Vitest para envio de WhatsApp

## Fase 12: Integração de WhatsApp e Testes de Integração
- [x] Implementar integração real com Twilio ou WhatsApp Cloud API
- [x] Criar testes de integração para bookings.create com desconto e limpeza
- [x] Validar persistência de campos no banco de dados
- [x] Testar fluxo completo de reserva com notificação ao dono
- [x] Implementar retry/fallback para falhas de WhatsApp


## Fase 13: Ajustes de Layout e Comodidades
- [x] Reorganizar espaçamento da landing page para melhor legibilidade
- [x] Converter seleção de quartos em dropdown/select
- [x] Atualizar preço de todos os quartos para R$ 80,00
- [x] Remover comodidades: Ar Condicionado, Café da Manhã, Cozinha Compartilhada
- [x] Manter apenas: WiFi, Espaço Social, Localização Estratégica
- [x] Ajustar layout responsivo para mobile


## Fase 14: Corrigir Nomes dos Quartos e Opções de Ocupação
- [x] Renomear quartos para "Quarto 01" até "Quarto 07"
- [x] Adicionar opção de escolher 1 pessoa ou 2 pessoas por quarto
- [x] Atualizar descrição dos quartos com capacidade
- [x] Validar desconto de 12% apenas para 1 pessoa


## Fase 15: Remover Tipo de Diária e Adicionar Resumo
- [x] Remover seção "Tipo de Diária" do formulário
- [x] Criar página de resumo da reserva
- [x] Validar todos os campos como obrigatórios
- [x] Bloquear botão de reserva se campos vazios
- [x] Enviar resumo para WhatsApp ao finalizar
- [x] Exibir mensagem de sucesso com código de confirmação


## Fase 16: Botão de Envio para WhatsApp
- [x] Adicionar botão "Enviar para WhatsApp" na página de resumo
- [x] Integrar número do dono (11 95219-7283)
- [x] Formatar mensagem com todos os detalhes da reserva
- [x] Testar fluxo completo de envio


## Fase 17: Corrigir Fluxo de Finalização
- [x] Remover botão "Editar Reserva" da página de resumo
- [x] Deixar apenas botão "Enviar para WhatsApp" como ação principal
- [x] Botão deve finalizar a reserva E abrir WhatsApp automaticamente
- [x] Validar fluxo completo


## Fase 18: Remover Página de Resumo - Enviar Direto para WhatsApp
- [x] Remover página de resumo (showReview)
- [x] Botão "Finalizar e Enviar para WhatsApp" deve validar e enviar direto
- [x] Exibir confirmação de sucesso após envio
- [x] Testar fluxo completo


## Fase 19: Envio Automático para WhatsApp
- [x] Remover mensagem de "copiar e colar"
- [x] Enviar automaticamente para WhatsApp ao clicar no botão
- [x] Sem necessidade de copiar manualmente


## Fase 20: Abrir WhatsApp Business em vez de WhatsApp Normal
- [x] Modificar link para abrir WhatsApp Business (wa.me → api.whatsapp.com ou whatsapp business)
- [x] Testar em celular para garantir que abre o Business
- [x] Validar que a mensagem é enviada corretamente

## Fase 21: Sistema de Bloqueio de Datas com Senha
- [x] Criar tabela de bloqueio de datas no banco
- [x] Implementar página de gerenciamento de bloqueios (/admin/bloqueios)
- [x] Adicionar senha padrão: Capacho@69
- [x] Implementar botão de mostrar/ocultar senha
- [x] Bloquear automaticamente datas quando tiver reserva
- [x] Validar datas bloqueadas no formulário de reserva
- [x] Mostrar datas bloqueadas visualmente no calendário

## Fase 22: Correção de Timezone e Datas
- [x] Corrigir problema de datas atrasadas em 1 dia
- [x] Armazenar datas como VARCHAR (strings YYYY-MM-DD) no banco
- [x] Adicionar +1 dia na exibição da data na mensagem WhatsApp
- [x] Validar datas corretas no celular
- [x] Todos os testes Vitest passando


## Fase 23: Adicionar Horários de Check-in e Check-out
- [x] Adicionar aviso com horários: Check-in 14h-23h30, Check-out até 12h
- [x] Criar dropdown para escolher horário de check-in (14h até 23h30)
- [x] Criar dropdown para escolher horário de check-out (até 12h)
- [x] Tornar ambos os campos obrigatórios
- [x] Incluir horários na mensagem de confirmação WhatsApp
- [x] Validar formulário com novos campos
- [x] Testar fluxo completo com horários


## Fase 24: Seleção Múltipla de Datas e Quartos no Admin
- [x] Adicionar checkbox para seleção múltipla de datas
- [x] Adicionar checkbox para seleção múltipla de quartos
- [x] Permitir bloquear/desbloquear múltiplas datas de uma vez
- [x] Permitir bloquear/desbloquear múltiplos quartos de uma vez
- [x] Manter estrutura atual do site intacta
- [x] Testar seleção e ações em massa

## Fase 26: Corrigir Bug de Desbloquear Múltiplas Datas
- [x] Corrigir sincronização do checkbox "Selecionar Tudo"
- [x] Adicionar useEffect para sincronizar selectAll automaticamente
- [x] Limpar seleção ao trocar de quarto
- [x] Testar desbloquear múltiplas datas sem sair da página

## Fase 27: Painel de Controle de Acesso e Logs de Auditoria
- [x] Criar tabela auditLog no schema
- [x] Criar função para registrar logs de auditoria
- [x] Atualizar rotas tRPC para registrar ações
- [x] Criar página de Painel de Controle de Acesso
- [x] Criar página de Logs de Auditoria
- [x] Testar fluxo completo

## Fase 28: Alertas de Atividade Suspeita
- [x] Criar tabela failedUnblockAttempts no schema
- [x] Implementar funções de banco de dados para registrar tentativas falhadas
- [x] Atualizar rota tRPC para registrar tentativas falhadas
- [x] Criar lógica de detecção de atividade suspeita (3+ tentativas em 5 minutos)
- [x] Implementar notificação ao admin via notifyOwner
- [x] Criar página de Alertas de Segurança
- [x] Testar fluxo completo

## Bug: Bloquear/Desbloquear Datas Falha no Desktop
- [x] Investigar erro específico do navegador desktop
- [x] Verificar compatibilidade de tipos de dados
- [x] Corrigir problema de responsividade
- [x] Testar em múltiplos navegadores

## Bug: Calendário Mostra Data Anterior ao Bloquear
- [x] Investigar problema de timezone no calendário
- [x] Corrigir conversão de datas entre frontend e backend
- [x] Sincronizar horário local com horário do servidor
- [x] Testar bloqueio em múltiplas datas

## Fase 29: Calendário Visual e Bloqueio em Massa
- [x] Instalar biblioteca react-calendar
- [x] Criar componente de calendário visual com datas bloqueadas em vermelho
- [x] Implementar seleção de intervalo de datas para bloqueio em massa
- [x] Adicionar botão de "Bloquear Período" que bloqueia todas as datas do intervalo
- [x] Testar bloqueio em massa com múltiplas datas

## Fase 30: Exceções de Bloqueio
- [x] Criar tabela blockingExceptions no schema
- [x] Criar rota tRPC para adicionar/remover exceções
- [ ] Implementar UI para gerenciar exceções
- [ ] Permitir desbloquear datas específicas dentro de um período bloqueado
- [ ] Testar fluxo completo de exceções

## Bug: Erro ao Criar Reserva - "Tente Novamente"
- [x] Investigar erro na rota de criacao de reserva
- [x] Verificar validacao de campos do formulario
- [x] Corrigir problema de serializacao de datas
- [x] Testar fluxo completo de reserva


## Bug: Erro ao Criar Reserva Continua Após Publicação
- [x] Verificar logs do servidor em produção
- [x] Debugar fluxo completo de criação de reserva
- [x] Corrigir problema de serialização ou validação
- [x] Testar em produção após correção


## Bug: Datas Bloqueadas Não Aparecem Após Bloquear
- [x] Investigar por que datas bloqueadas não aparecem na listagem
- [x] Verificar se estão sendo salvass no banco de dados
- [x] Corrigir consulta de datas bloqueadas por quarto
- [x] Testar fluxo completo de bloqueio e visualização

## Bug: Erro "unknown error" ao Desbloquear Datas
- [x] Corrigir nome do parâmetro blockedDateId para id em BlockedDates.tsx
- [x] Corrigir schema para permitir userId nullable em failedUnblockAttempts
- [x] Corrigir db.ts para usar null em vez de 0 para userId
- [x] Gerar migração SQL com drizzle-kit
- [x] Executar migração SQL no banco de dados
- [x] Corrigir senha hardcoded de 1234 para Capacho@69
- [x] Adicionar console.log para debugar erros de tRPC
- [x] Testar desbloqueio com senha correta
- [x] Testar desbloqueio com senha incorreta

## Fase 31: Bloqueio Automático de Datas ao Criar Reserva
- [x] Implementar bloqueio automático ao criar reserva
- [x] Adicionar motivo automático com nome do hóspede
- [x] Testar fluxo completo de reserva com bloqueio automático

## Fase 32: Corrigir Bloqueio de Datas com Suporte a Horas
- [x] Corrigir lógica de bloqueio de data única (16/04 até 16/04 não deve virar 16/04 até 17/04)
- [x] Adicionar seleção de horas ao bloquear datas
- [x] Adicionar seleção de horas ao desbloquear datas (UI modal com senha)
- [x] Corrigir calendário para exibir apenas datas realmente bloqueadas
- [x] Testar bloqueio com data única
- [x] Testar bloqueio com horas específicas
- [x] Testar calendário com datas corretas

## Bug: Erro ao Criar Reserva
- [x] Investigar erro ao criar reserva
- [x] Identificar causa do erro (insertId undefined no Drizzle)
- [x] Corrigir o erro (extrair insertId corretamente)
- [x] Testar criação de reserva

## Fase 33: Adicionar Ícone de Bloqueio no Calendário
- [x] Adicionar ícone 🔒 ou 📅 nas datas bloqueadas do calendário
- [x] Melhorar visualização das datas bloqueadas com ícone
- [x] Testar calendário com ícones de bloqueio

## Bug: Erro de JSON Parsing na API
- [x] Investigar qual rota está retornando JSON inválido
- [x] Identificar causa do erro de parsing (servidor não recarregou funções de db.ts)
- [x] Corrigir a rota para retornar JSON válido (reiniciar servidor)
- [x] Testar página inicial sem erro de JSON
