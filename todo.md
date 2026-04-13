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
- [ ] Integrar API real de WhatsApp (Twilio ou WhatsApp Cloud API)
- [ ] Ajustar lógica de desconto para usar dailyType consistentemente
- [ ] Criar testes Vitest para envio de WhatsApp
- [ ] Validar fluxo completo de reserva com desconto e limpeza
