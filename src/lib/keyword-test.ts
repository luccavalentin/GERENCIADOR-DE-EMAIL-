
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasKeyword(content: string, keywords: string[]): boolean {
  const normalizedContent = normalizeText(content);
  return keywords.some((kw) => {
    const normalizedKw = normalizeText(kw);
    return normalizedContent.includes(normalizedKw);
  });
}

const testCases = [
  // TRUE cases
  { input: "codigo", expected: true },
  { input: "Código", expected: true },
  { input: "CÓDIGO", expected: true },
  { input: "CODIGO", expected: true },
  { input: "códigos", expected: true },
  { input: "CODIGOS", expected: true },
  { input: "Seu código é 123456", expected: true },
  { input: "Código: 123456", expected: true },
  { input: "Código - 123456", expected: true },
  { input: "Código de acesso", expected: true },
  { input: "meucodigo", expected: true },
  { input: "codigo123", expected: true },
  { input: "123codigo", expected: true },
  { input: "codigoverificacao", expected: true },
  { input: "codigoseguranca", expected: true },
  { input: "codigoconfirmacao", expected: true },
  // FALSE cases
  { input: "Olá, tudo bem?", expected: false },
  { input: "Sua proposta foi recebida", expected: false },
  { input: "123456", expected: false },
  { input: "Token 123456", expected: false },
  { input: "OTP 123456", expected: false },
  { input: "PIN 123456", expected: false },
];

const keywords = ["codigo"];

console.log("| Entrada | Esperado | Resultado | Passou/Falhou |");
console.log("|---------|----------|-----------|---------------|");

let allPassed = true;

testCases.forEach((tc) => {
  const result = hasKeyword(tc.input, keywords);
  const passed = result === tc.expected;
  if (!passed) allPassed = false;
  console.log(`| ${tc.input} | ${tc.expected} | ${result} | ${passed ? "✅ Passou" : "❌ Falhou"} |`);
});

if (!allPassed) {
  process.exit(1);
}
