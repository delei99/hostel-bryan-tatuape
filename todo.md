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
- [x] Cri## Fase 30: Implementar Exceções de Bloqueio
- [x] Implementar UI para gerenciar exceções
- [x] Permitir desbloquear datas específicas dentro de um período bloqueado
- [x] Testar fluxo completo de exceções

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

## Fase 32: Upload de Fotos com Multer e Sharp
- [x] Implementar endpoint /api/upload-room-photo com multer
- [x] Integrar Sharp para otimização de imagens
- [x] Corrigir erros de TypeScript em blockingExceptions
- [x] Validar fluxo end-to-end de upload e exibição
- [x] Testar endpoint de upload com curl

## Fase 33: Corrigir Bloqueio de Datas com Suporte a Horas
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

## Fase 34: Adicionar Imagem do Hostel no Campo de Imagem
- [x] Adicionar imagem da fachada vermelha do Hostel
- [x] Posicionar imagem corretamente no campo
- [x] Testar visualização da imagem

## Fase 35: Implementar Mapa Interativo do Google Maps
- [x] Adicionar componente de mapa interativo na seção "Localização"
- [x] Mostrar localização exata do Hostel Bryan Tatuapé
- [x] Testar mapa interativo

## Fase 36: Restaurar Código de Reserva e Envio WhatsApp
- [x] Verificar se código de reserva está sendo gerado
- [x] Implementar envio do código pelo WhatsApp (já estava implementado)
- [x] Testar fluxo completo de reserva com código e WhatsApp

## Fase 37: Implementar Galeria de Quartos com Dropdown e Carrossel
- [x] Criar página de galeria com dropdown de quartos 01-07
- [x] Implementar carrossel de fotos com navegação lateral (setas)
- [x] Integrar com banco de dados de fotos de quartos
- [x] Adicionar miniaturas de preview no dropdown
- [x] Testar galeria completa

## Fase 38: Adicionar Botão de Solicitar Reserva na Galeria
- [x] Adicionar botão "Solicitar Reserva" na página de quarto
- [x] Pré-selecionar quarto ao ir para reserva
- [x] Testar fluxo de reserva a partir da galeria

## Fase 39: Implementar Sistema de Upload de Fotos dos Quartos
- [x] Criar página de admin para upload de fotos
- [x] Permitir seleção de quarto (01-07)
- [x] Suportar upload de até 10 fotos por quarto
- [x] Otimizar fotos automaticamente (redimensionar e comprimir)
- [x] Armazenar fotos em S3
- [x] Testar upload e visualização na galeria

## Bug: Check-in Bloqueado Aparece um Dia Anterior
- [x] Investigar por que check-in bloqueado aparece um dia anterior no calendário
- [x] Corrigir lógica de bloqueio de datas ao criar reserva (usar Date.UTC)
- [x] Corrigir exibição de datas no calendário (normalização com UTC)
- [x] Corrigir isDateExcepted para usar UTC
- [x] Testar fluxo completo de reserva e bloqueio

## Fase 34: Sistema de Descontos por Duração e Edição de Datas Bloqueadas
- [x] Implementar cálculo de desconto por duração (7 dias: 11%, 14 dias: 20%, 28 dias: 35%)
- [x] Exibir desconto claramente na página de finalização
- [x] Enviar desconto no WhatsApp (já implementado)
- [x] Adicionar coluna observation em datas bloqueadas
- [x] Implementar rota tRPC para editar datas bloqueadas
- [x] Exibir horário de criação das datas bloqueadas no calendário

## Bug: Erro "unknown error" ao Acessar Página de Datas Bloqueadas
- [x] Remover diretiva 'use client' do BlockedDates.tsx (não é Next.js)
- [x] Mover import de CSS react-calendar para index.css (evita problema de bundling)
- [x] Corrigir função normalizeDate em BlockedDatesCalendar.tsx
- [x] Testar página de datas bloqueadas sem erro
- [x] Todos os 35 testes passando


## Fase 40: Implementação Completa de Upload com Sharp e S3
- [x] Criar rota tRPC `uploadAndOptimize` com Sharp para redimensionar/comprimir
- [x] Integrar `storagePut` para salvar em S3
- [x] Atualizar página RoomPhotosUpload.tsx com upload real de arquivos
- [x] Suportar múltiplos arquivos (até 10 por quarto)
- [x] Converter arquivos para base64 no frontend
- [x] Validar e testar fluxo completo


## Fase 41: Integração de Exceções na Lógica de Reserva
- [x] Atualizar função isDateBlocked para consultar exceções
- [x] Integrar query de exceções no Booking.tsx
- [x] Testar fluxo completo de reserva com datas excepcionadas
- [x] Validar que datas excepcionadas ficam disponíveis


## Fase 42: Correção do Erro ao Fazer Reserva
- [x] Corrigir mismatch de contrato tRPC (checkInDate/checkOutDate como strings)
- [x] Adicionar campos opcionais ao input do bookings.create
- [x] Converter numberOfGuests para string ao enviar
- [x] Testar fluxo de reserva completo

## Fase 43: Correção de Erros de JavaScript em Produção
- [x] Remover useEffect que tentava chamar .query() em proxy de hooks
- [x] Simplificar lógica de bloqueio para usar apenas bloqueios diretos
- [x] Validar que console está limpo em produção
- [x] Testar fluxo completo


## Fase 44: Correção de Validação de Email
- [x] Corrigir regex muito restritivo de validação de email
- [x] Usar validação mais flexível com .email().or(regex simples)
- [x] Testar com diferentes formatos de email


## Fase 45: Adicionar Quantidade de Dias na Reserva
- [x] Calcular quantidade de dias entre check-in e check-out
- [x] Exibir quantidade de dias no resumo da reserva
- [x] Testar cálculo com diferentes períodos\u00edodos


## Fase 46: Corrigir Problemas de Calendário e WhatsApp
- [x] Corrigir bloqueio de data um dia antes no calendário (normalizar datas com timezone local)
- [x] Adicionar número da reserva na mensagem WhatsApp (com fallback)
- [x] Adicionar logging para debug de bookingSuccess
- [x] Corrigir exibição de datas bloqueadas para usar normalizeDate
- [x] Testar ambas as correções


## Fase 47: Correção Final de Lógica de Bloqueio com UTC
- [x] Remover inversão de lógica na condição de conflito
- [x] Ajustar para não bloquear o dia do check-out
- [x] Corrigir normalizeDate para usar UTC getters (Date.UTC)
- [x] Corrigir exibição de datas bloqueadas para usar UTC
- [x] Testar com datas específicas (25/05/2026)


## Fase 48: Adicionar Opção de Mudar de Quarto na Edição
- [x] Adicionar seletor de quarto na página de edição de reserva
- [x] Implementar atualização automática de datas bloqueadas ao mudar quarto
- [x] Atualizar calendário para refletir novo quarto
- [x] Testar fluxo completo de mudança de quarto


## Fase 49: Adicionar Botão Editar no Admin Dashboard
- [x] Encontrar página do admin dashboard com listagem de reservas
- [x] Adicionar coluna de ações com botão Editar
- [x] Implementar navegação para EditBooking.tsx?id=ID
- [x] Testar fluxo completo de edição de reserva

## Fase 50: Corrigir Erro "Unknown Error" e Sincronizar Exceções
- [x] Investigar e diagnosticar erro "unknown error" na página de bloqueios
- [x] Identificar problema com formato de datas MySQL (YYYY-MM-DD HH:mm:ss)
- [x] Corrigir função normalizeDate em BlockedDatesCalendar.tsx
- [x] Corrigir função normalizeDate em Booking.tsx
- [x] Corrigir função normalizeDate em EditBooking.tsx
- [x] Implementar rota blockingExceptions.getByRoom em routers.ts
- [x] Implementar função getBlockingExceptionsByRoom em db.ts
- [x] Adicionar prop exceptions ao BlockedDatesCalendar
- [x] Atualizar isDateBlocked para considerar exceções
- [x] Sincronizar calendário visual com exceções
- [x] Todos os 47 testes passando
- [x] TypeScript compilando sem erros

## Fase 51: Otimizar Build para Deploy
- [x] Identificar problema de bundle grande (1.08 MB)
- [x] Implementar code-splitting no vite.config.ts
- [x] Dividir bundle em chunks: react-vendor, ui-vendor, calendar, trpc
- [x] Adicionar rollup-plugin-visualizer para análise
- [x] Reduzir tamanho do chunk principal (859 KB gzip 199 KB)
- [x] Todos os 47 testes continuam passando
- [x] Build otimizado e funcionando

## Fase 52: Implementar Lazy Loading de Rotas
- [x] Implementar React.lazy() para páginas administrativas
- [x] Criar componente LoadingFallback para melhor UX
- [x] Envolver rotas lazy com Suspense
- [x] Reduzir bundle principal de 859.87 KB para 580.88 KB (32% redução)
- [x] Chunks separados para: AdminDashboard, AdminRooms, AdminRoomPhotos, PhotoUpload, BlockedDates, RoomPhotosUpload
- [x] Corrigir teste de blocking exceptions
- [x] Todos os 47 testes continuam passando
- [x] Build otimizado e funcionando

## Fase 53: Adicionar Opção "Salvar como Nova Reserva"
- [x] Adicionar botão "Salvar como nova reserva" em AdminDashboard.tsx (página de editar reserva)
- [x] Implementar modal com toggle para escolher entre usar dados do hóspede atual ou novo
- [x] Mostrar dados do hóspede atual quando selecionado
- [x] Mostrar campos vazios para novo hóspede quando selecionado
- [x] Implementar lógica para criar nova reserva com dados selecionados
- [x] Testar fluxo completo
- [x] Todos os 47 testes continuam passando

## Fase 54: Adicionar Colunas de Ação na Tabela de Reservas (WhatsApp, Imprimir, PDF)
- [x] Adicionar botão WhatsApp para enviar recibo e comprovante
- [x] Adicionar botão Imprimir para imprimir recibo
- [x] Adicionar botão PDF para gerar e baixar comprovante
- [x] Implementar função de geração de PDF do comprovante
- [x] Implementar função de envio via WhatsApp
- [x] Implementar função de impressão
- [x] Testar fluxo completo
- [x] Todos os 47 testes continuam passando

## Fase 55: Formatar Recibo com Fundo Verde e Mensagem WhatsApp
- [x] Atualizar generateReceiptPDF com fundo verde e texto branco
- [x] Adicionar todos os campos do recibo (número, código, hóspede, período, valores)
- [x] Atualizar handleSendWhatsApp com mensagem formatada
- [x] Incluir desconto e observações na mensagem
- [x] Testar fluxo completo
- [x] Todos os 47 testes continuam passando

## Fase 56: Adicionar Upload de Imagens para Página Principal
- [ ] Criar tabela no banco de dados para armazenar URLs de imagens da home
- [ ] Implementar endpoint tRPC para upload de imagens
- [ ] Adicionar interface de upload no painel administrativo
- [ ] Exibir duas imagens lado a lado na página principal
- [ ] Testar fluxo completo

## Fase 56: Adicionar Upload de Imagens para Página Principal
- [x] Criar tabela homeImages no banco de dados
- [x] Implementar funções de CRUD em db.ts
- [x] Adicionar procedures tRPC para homeImages
- [x] Atualizar Home.tsx para exibir duas imagens lado a lado
- [x] Testar fluxo completo
- [x] Todos os 47 testes continuam passando

## Fase 57: Criar Interface de Upload no Admin
- [x] Adicionar botão "Imagens da Home" no AdminDashboard
- [x] Implementar modal de upload com preview em tempo real
- [x] Adicionar seleção de posição (left/right)
- [x] Integrar com tRPC para salvar imagens
- [x] Testar fluxo completo
- [x] Todos os 47 testes continuam passando

## Fase 58: Implementar Compressão de Imagens
- [x] Instalar Sharp para otimização de imagens
- [x] Criar função de compressão no backend (imageCompression.ts)
- [x] Adicionar funções de compressão e metadata
- [x] Pronto para integração com upload de imagens
- [x] Todos os 47 testes continuam passando

## Fase 59: Usar Preço Vigente na Cobrança de Reservas
- [x] Atualizar cálculo de preço na função de criar reserva para usar preço atual do quarto
- [x] Atualizar cálculo de preço na função de editar reserva para usar preço atual
- [x] Garantir que mudanças de preço não afetam reservas já confirmadas
- [x] Testar fluxo completo com mudanças de preço

## Bug: Criação Automática de Reservas ao Atualizar Admin
- [x] Investigar por que atualizações no admin criam reservas para Quarto 01
- [x] Identificar que editFormData estava sendo inicializado incorretamente
- [x] Corrigir inicialização de editFormData para extrair booking.booking
- [x] Testar que testes continuam passando

## Bug: numberOfGuests como número em vez de string
- [x] Corrigir conversão de numberOfGuests para string ao enviar para servidor
- [x] Testar que testes continuam passando

## Melhoria: Quebra de linha no dropdown de quarto
- [x] Quebrar linha no dropdown de quarto para melhor visualização no celular
- [x] Exibir tipo de quarto em linha separada com estilo reduzido
- [x] Testar que testes continuam passando

## Bug: Criação Automática de Reservas ao Entrar no Admin
- [x] Investigar por que reservas aleatórias eram criadas ao entrar no AdminDashboard
- [x] Identificar que server/pricing.test.ts estava sendo importado e criando reservas
- [x] Mover todos os arquivos .test.ts de server/ para tests/server/
- [x] Atualizar vitest.config.ts para incluir testes da pasta tests/
- [x] Corrigir imports nos arquivos de teste (auth.logout.test.ts e pricing.test.ts)
- [x] Verificar que todos os 53 testes continuam passando
- [x] Reiniciar servidor para aplicar mudanças

## Bug: Preço do Quarto 01 Exibido Incorretamente
- [x] Investigar por que preço 80,00 aparecia como 0,80 no admin
- [x] Corrigir conversão de preço em AdminRooms.tsx
- [x] Adicionar toFixed(2) para exibir preço corretamente
- [x] Adicionar step="0.01" no input de preço
- [x] Testar que todos os 53 testes continuam passando

## Correção: Número de Telefone na Home
- [x] Corrigir número de telefone de (11) 99521-97283 para (11) 95219-7283 na seção "Sobre"
- [x] Corrigir número de telefone no footer
- [x] Testar que todos os 53 testes continuam passando

## Bug: Desbloquear Múltiplas Datas Falhava
- [x] Investigar por que desbloquear múltiplas datas marcadas dava erro
- [x] Identificar que Promise.all abortava tudo se uma falha
- [x] Trocar Promise.all por Promise.allSettled
- [x] Adicionar contagem de sucessos e falhas
- [x] Melhorar tratamento de erros com feedback granular
- [x] Testar que todos os 53 testes continuam passando

## Melhoria: Aumentar Limite de Dígitos para Números Internacionais
- [x] Aumentar limite de dígitos no campo de telefone de 15 para 20
- [x] Suportar números internacionais completos (Brasil, EUA, Alemanha, etc.)
- [x] Corrigir erros de TypeScript em Booking.tsx (useQuery, checkAvailability)
- [x] Testar que todos os 53 testes continuam passando
- [x] Validar que números brasileiros (13 dígitos) e internacionais funcionam
- [x] Criar testes de validação de telefone (5 novos testes)
- [x] Corrigir regex para detectar apenas DDDs válidos brasileiros (11-99)
- [x] Validar que 58 testes passam (53 + 5 novos)


## Melhoria: Restaurar Página de Reserva com Taxa de Limpeza Editável
- [x] Adicionar coluna cleaningFee ao schema de rooms
- [x] Criar migration SQL para adicionar cleaningFee
- [x] Atualizar AdminRooms.tsx com campo de taxa de limpeza
- [x] Restaurar página de resumo de reserva (BookingSummary)
- [x] Implementar desconto de 12% para uma pessoa
- [x] Exibir taxa de limpeza dinâmica na reserva
- [x] Adicionar botão "Enviar para WhatsApp" no resumo
- [x] Testar fluxo completo de reserva


## Melhoria: Descontos por Duração Editáveis
- [x] Adicionar colunas de desconto ao schema (discount7Days, discount15Days, discount30Days)
- [x] Criar migration SQL para adicionar colunas
- [x] Adicionar campos de desconto no painel AdminRooms (criar e editar)
- [x] Atualizar Booking.tsx para usar descontos dinâmicos do banco
- [x] Testar que descontos são aplicados corretamente
- [x] Validar que 58 testes continuam passando


## Melhoria: Campo de Pagamento na Reserva
- [x] Adicionar campo "Pagamento no ato da reserva" (editável)
- [x] Adicionar campo "Pagamento no check-in" (automático = Total - Pagamento ato)
- [x] Exibir campos antes do botão "Finalizar Reserva"
- [x] Validar que pagamento no ato não exceda o total
- [x] Testar fluxo completo (58 testes passando)


## Melhoria: Validação de CPF e Documentos na Reserva
- [x] Validar CPF (algoritmo de validação)
- [x] Adicionar dropdown para tipo de documento (RG, Passaporte)
- [x] Adicionar campo UF para RG
- [x] Validar RG e Passaporte (números válidos)
- [x] Tornar RG ou Passaporte obrigatório
- [x] Posicionar antes do campo "Observações"
- [x] Testar validações completas (58 testes passando)


## Bug Fix: Exibir RG/Passaporte no Recibo do WhatsApp
- [x] Adicionar documentNumber ao banco de dados na tabela bookings
- [x] Adicionar documentType ao banco de dados na tabela bookings
- [x] Salvar RG/Passaporte quando a reserva é criada
- [x] Exibir RG/Passaporte no recibo do WhatsApp (junto com CPF)
- [x] Testar que recibo mostra todos os dados corretamente (58 testes passando)


## Melhoria: Remover Dropdown e Adicionar Campos Separados de RG/Passaporte
- [x] Remover dropdown de tipo de documento (RG/Passaporte)
- [x] Adicionar campo de RG com UF (na mesma linha)
- [x] Adicionar campo de Passaporte (em outra linha)
- [x] Quebrar linha no texto "Banheiro Compartilhado" para melhor visualização no celular
- [x] Testar que validações continuam funcionando (58 testes passando)


## Melhoria: RG e Passaporte Opcionais (Apenas CPF Obrigatório)
- [x] Remover obrigatoriedade de preencher RG
- [x] Remover obrigatoriedade de preencher Passaporte
- [x] Manter CPF como obrigatório e válido
- [x] Se RG ou Passaporte forem preenchidos, devem ser válidos
- [x] Atualizar mensagens de erro
- [x] Testar validações (58 testes passando)


## Melhoria: Máscara de Formatação Automática no Campo de CPF
- [x] Criar função de formatação de CPF (000.000.000-00)
- [x] Aplicar máscara enquanto o usuário digita
- [x] Permitir que validação funcione com ou sem máscara
- [x] Testar formatação com diferentes entradas (58 testes passando)


## Melhoria: Remover Asteriscos de RG e UF (Indicar Opcionais)
- [x] Remover asterisco (*) do label "Número do RG"
- [x] Remover asterisco (*) do label "UF"
- [x] Remover atributo required do input de RG
- [x] Testar que validações continuam funcionando (58 testes passando)


## Melhoria: Mensagem de Erro Clara para CPF Inválido
- [x] Adicionar validação em tempo real do CPF
- [x] Exibir mensagem de erro abaixo do campo de CPF
- [x] Mensagem desaparece quando CPF fica válido
- [x] Testar com diferentes entradas de CPF (58 testes passando)


## Melhoria: Mensagem de Aviso no Campo de Passaporte
- [x] Adicionar mensagem em vermelho abaixo do campo de Passaporte
- [x] Texto: "Atenção!!!! O numero do documento tem que ser o mesmo que vai ser apresentado no chek-in."
- [x] Testar que mensagem aparece corretamente (58 testes passando)


## Melhoria: Ícone de Confirmação Verde no Campo de CPF
- [x] Adicionar ícone de confirmação verde quando CPF é válido
- [x] Posicionar ícone ao lado do campo de CPF
- [x] Usar ícone CheckCircle (lucide-react)
- [x] Testar que ícone aparece apenas quando CPF é válido


## Melhoria: Sincronização Automática de Edição de Reservas nas Datas Bloqueadas
- [x] Implementar sincronização automática ao editar reserva
- [x] Atualizar datas bloqueadas quando reserva é modificada
- [x] Refletir mudanças no painel administrativo em tempo real
- [x] Sem alteração de layout do projeto
- [x] Testar fluxo completo de edição e sincronização


## Melhoria: Adicionar Código de Confirmação nas Fichas de Datas Bloqueadas
- [x] Adicionar código de confirmação no campo "Motivo:" das datas bloqueadas
- [x] Atualizar todas as fichas existentes dos quartos 1-7 com código de confirmação
- [x] Novas reservas incluem código de confirmação automaticamente
- [x] Sem alteração de layout do projeto
- [x] Todos os 58 testes passando


## Correção: Desconto de 7, 15, 30 Dias Não Está Sendo Aplicado
- [x] Verificar lógica de cálculo de desconto na função de preço
- [x] Aplicar desconto automaticamente ao finalizar reserva
- [x] Exibir desconto na mensagem do WhatsApp
- [x] Testar desconto para 7, 15 e 30 dias
- [x] Sem alteração de layout do projeto
