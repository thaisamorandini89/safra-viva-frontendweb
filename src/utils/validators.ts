// ---------------------------------------------------------------------------
// Validadores de campos — orientados a objetos (padrão Strategy)
//
// Cada validador implementa o contrato `Validador`, permitindo compor regras
// de forma reutilizável. `compor` encadeia validadores e devolve a primeira
// mensagem de erro encontrada (Chain of Responsibility).
// ---------------------------------------------------------------------------

/** Mensagem de erro quando inválido, ou `null` quando o valor é válido. */
export type ResultadoValidacao = string | null;

/** Contrato comum para validadores de campo. */
export interface Validador {
  validar(valor: string): ResultadoValidacao;
}

/** Garante que o campo foi preenchido. */
export class CampoObrigatorio implements Validador {
  constructor(private readonly mensagem: string) {}

  validar(valor: string): ResultadoValidacao {
    return valor.trim().length > 0 ? null : this.mensagem;
  }
}

/** Valida o formato de e-mail. Ignora valores vazios (obrigatoriedade é responsabilidade de `CampoObrigatorio`). */
export class ValidadorEmail implements Validador {
  private static readonly PADRAO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private readonly mensagem = "Informe um e-mail válido (ex.: nome@empresa.com.br)."
  ) {}

  validar(valor: string): ResultadoValidacao {
    const texto = valor.trim();
    if (!texto) return null;
    return ValidadorEmail.PADRAO.test(texto) ? null : this.mensagem;
  }
}

/** Valida um CNPJ conferindo os dígitos verificadores. Ignora valores vazios. */
export class ValidadorCNPJ implements Validador {
  constructor(private readonly mensagem = "CNPJ inválido. Verifique os dígitos informados.") {}

  validar(valor: string): ResultadoValidacao {
    const digitos = valor.replace(/\D/g, "");
    if (!digitos) return null;
    if (digitos.length !== 14) return "O CNPJ deve conter 14 dígitos.";
    return ValidadorCNPJ.ehValido(digitos) ? null : this.mensagem;
  }

  /** Algoritmo oficial de verificação dos dígitos do CNPJ. */
  static ehValido(cnpj: string): boolean {
    const digitos = cnpj.replace(/\D/g, "");
    if (digitos.length !== 14) return false;
    // Rejeita sequências repetidas (ex.: 11111111111111)
    if (/^(\d)\1{13}$/.test(digitos)) return false;

    const calcularDigito = (base: string, pesos: number[]): number => {
      const soma = base
        .split("")
        .reduce((total, num, i) => total + Number(num) * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const dv1 = calcularDigito(digitos.slice(0, 12), pesos1);
    if (dv1 !== Number(digitos[12])) return false;

    const dv2 = calcularDigito(digitos.slice(0, 13), pesos2);
    return dv2 === Number(digitos[13]);
  }
}

/** Valida um telefone brasileiro (fixo com 10 dígitos ou celular com 11). Ignora valores vazios. */
export class ValidadorTelefone implements Validador {
  constructor(
    private readonly mensagem = "Informe um telefone válido com DDD (10 dígitos para fixo, 11 para celular)."
  ) {}

  validar(valor: string): ResultadoValidacao {
    const digitos = valor.replace(/\D/g, "");
    if (!digitos) return null;
    return ValidadorTelefone.ehValido(digitos) ? null : this.mensagem;
  }

  static ehValido(telefone: string): boolean {
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length !== 10 && digitos.length !== 11) return false;
    // DDD válido (não pode começar com 0)
    if (digitos[0] === "0") return false;
    // Celular (11 dígitos) deve ter o 9 como primeiro dígito do número
    if (digitos.length === 11 && digitos[2] !== "9") return false;
    return true;
  }
}

/** Encadeia validadores e devolve a primeira mensagem de erro (ou `null`). */
export function compor(...validadores: Validador[]): Validador {
  return {
    validar(valor: string): ResultadoValidacao {
      for (const validador of validadores) {
        const erro = validador.validar(valor);
        if (erro) return erro;
      }
      return null;
    },
  };
}
