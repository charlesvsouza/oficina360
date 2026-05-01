export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Aplica máscara CPF (11 dígitos) ou CNPJ (14 dígitos) automaticamente */
export function formatCpfCnpj(value: string): string {
  const d = onlyDigits(value);
  if (d.length <= 11) return formatCpf(value);
  return formatCnpj(value);
}

export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatPlate(value: string): string {
  // Padrão Mercosul: ABC1D23 | Padrão antigo: ABC-1234
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (upper.length <= 3) return upper;
  return `${upper.slice(0, 3)}-${upper.slice(3)}`;
}

/** Busca dados do CNPJ via BrasilAPI (sem autenticação) */
export async function lookupCnpj(cnpj: string): Promise<{
  razaoSocial: string;
  nomeFantasia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
} | null> {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      razaoSocial: data.razao_social ?? '',
      nomeFantasia: data.nome_fantasia ?? '',
      logradouro: [data.logradouro, data.numero, data.bairro].filter(Boolean).join(', '),
      numero: data.numero ?? '',
      bairro: data.bairro ?? '',
      municipio: data.municipio ?? '',
      uf: data.uf ?? '',
      cep: data.cep ?? '',
      telefone: data.ddd_telefone_1
        ? formatPhone((data.ddd_telefone_1 as string).replace(/\D/g, ''))
        : '',
      email: data.email ?? '',
    };
  } catch {
    return null;
  }
}
