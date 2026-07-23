const { normalizePhone } = require('./phone-normalizer.js');

const cases = [
  // Spec cases (BR DDI)
  ['+55-99999-0000',          '999990000',    'BR celular -55-'],
  // Other DDIs
  ['+1-415-555-0123',         '4155550123',   'US fixo +1-'],
  ['+44-20 7946 0958',        '2079460958',   'UK +44- com espacos'],
  // No "+": return digits unchanged
  ['1199990000',              '1199990000',   'Sem mais'],
  ['',                        '',             'Vazio'],
  // "+" but no separator after DDI: ambiguous, returns digits without "+"
  ['+',                       '',             'Apenas mais'],
  ['+5511999990000',          '5511999990000','Mais sem traco'],
  // Edge cases
  [null,                      '',             'null'],
];

let pass = 0, fail = 0;
for (const [input, expected, name] of cases) {
  const out = normalizePhone(input);
  const ok = out.phone_clean === expected;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${name.padEnd(20)} in=${JSON.stringify(input)}  out=${out.phone_clean}  cc=${out.country_code}  had_plus=${out.had_plus}  ${ok ? '' : `(expected ${expected})`}`);
}
console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
