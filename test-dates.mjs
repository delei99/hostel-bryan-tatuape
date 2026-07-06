// Simular o que acontece no frontend e backend

// Frontend: usuário seleciona 05/07/2026 a 06/07/2026
const userSelectedCheckIn = "2026-07-05";
const userSelectedCheckOut = "2026-07-06";

console.log("=== FRONTEND ===");
console.log("Usuário selecionou:");
console.log("  Check-in:", userSelectedCheckIn);
console.log("  Check-out:", userSelectedCheckOut);

// Frontend envia strings YYYY-MM-DD para o backend
console.log("\nEnviando para backend:");
console.log("  checkInDate:", userSelectedCheckIn);
console.log("  checkOutDate:", userSelectedCheckOut);

// Backend recebe as strings
console.log("\n=== BACKEND ===");
console.log("Backend recebeu:");
console.log("  checkInDate:", userSelectedCheckIn);
console.log("  checkOutDate:", userSelectedCheckOut);

// Backend salva as strings no banco (VARCHAR)
console.log("\nSalvando no banco (VARCHAR):");
console.log("  checkInDate:", userSelectedCheckIn);
console.log("  checkOutDate:", userSelectedCheckOut);

// Quando o admin edita, o banco retorna as strings
console.log("\n=== ADMIN EDITA ===");
console.log("Banco retorna:");
console.log("  checkInDate:", userSelectedCheckIn);
console.log("  checkOutDate:", userSelectedCheckOut);

// Frontend coloca no formulário
console.log("\nFormulário recebe:");
console.log("  editFormData.checkInDate:", userSelectedCheckIn);
console.log("  editFormData.checkOutDate:", userSelectedCheckOut);

// Admin clica em "Salvar Alterações"
console.log("\nAdmin envia de volta:");
console.log("  checkInDate:", userSelectedCheckIn);
console.log("  checkOutDate:", userSelectedCheckOut);

// Agora vamos simular o que pode estar acontecendo com new Date()
console.log("\n=== PROBLEMA: new Date('YYYY-MM-DD') ===");
const badDate1 = new Date(userSelectedCheckIn);
const badDate2 = new Date(userSelectedCheckOut);
console.log("new Date('2026-07-05'):", badDate1.toISOString());
console.log("new Date('2026-07-06'):", badDate2.toISOString());
console.log("Problema: Interpretado como UTC, não como local!");

// Solução: parseYmdToLocalDate
console.log("\n=== SOLUÇÃO: parseYmdToLocalDate ===");
function parseYmdToLocalDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

const goodDate1 = parseYmdToLocalDate(userSelectedCheckIn);
const goodDate2 = parseYmdToLocalDate(userSelectedCheckOut);
console.log("parseYmdToLocalDate('2026-07-05'):", goodDate1);
console.log("parseYmdToLocalDate('2026-07-06'):", goodDate2);
console.log("Correto: Usa timezone local!");

// Verificar se há conversão de timezone acontecendo em algum lugar
console.log("\n=== VERIFICAR CONVERSÃO ===");
console.log("Timezone local:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Offset UTC:", new Date().getTimezoneOffset(), "minutos");
console.log("Offset em horas:", new Date().getTimezoneOffset() / 60, "horas");
