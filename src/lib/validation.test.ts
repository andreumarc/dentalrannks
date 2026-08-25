import { describe, expect, it } from "vitest";
import {
  phoneSchema,
  postalCodeSchema,
  leadFormSchema,
  topUpSchema,
  clinicSignupSchema,
  isSafeExternalUrl,
} from "./validation";

describe("phoneSchema", () => {
  it("acepta móviles y fijos españoles válidos", () => {
    expect(phoneSchema.safeParse("612345678").success).toBe(true); // móvil (6)
    expect(phoneSchema.safeParse("712345678").success).toBe(true); // móvil (7)
    expect(phoneSchema.safeParse("912345678").success).toBe(true); // fijo (9)
    expect(phoneSchema.safeParse("812345678").success).toBe(true); // fijo (8)
  });

  it("acepta el prefijo internacional +34", () => {
    expect(phoneSchema.safeParse("+34612345678").success).toBe(true);
    expect(phoneSchema.safeParse("0034612345678").success).toBe(false); // 0034 no está contemplado por el regex de dígitos
    expect(phoneSchema.safeParse("+34 612 345 678").success).toBe(true);
  });

  it("rechaza números que no empiezan por 6, 7, 8 o 9", () => {
    expect(phoneSchema.safeParse("512345678").success).toBe(false);
    expect(phoneSchema.safeParse("123456789").success).toBe(false);
  });

  it("rechaza números demasiado cortos o con letras", () => {
    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("61234567a").success).toBe(false);
  });
});

describe("postalCodeSchema", () => {
  it("acepta códigos postales de 5 dígitos", () => {
    expect(postalCodeSchema.safeParse("28001").success).toBe(true);
    expect(postalCodeSchema.safeParse("08001").success).toBe(true);
  });

  it("rechaza códigos postales con una longitud distinta de 5", () => {
    expect(postalCodeSchema.safeParse("2800").success).toBe(false);
    expect(postalCodeSchema.safeParse("280011").success).toBe(false);
  });

  it("rechaza códigos postales con caracteres no numéricos", () => {
    expect(postalCodeSchema.safeParse("2800A").success).toBe(false);
  });
});

describe("leadFormSchema", () => {
  function validLead() {
    return {
      clinicId: "clinic_1",
      source: "SEARCH_RESULTS" as const,
      name: "Ana García",
      phone: "612345678",
      email: "ana@example.com",
      postalCode: "28001",
      timePreference: "ANY" as const,
      comment: "",
      consentDataSharing: true,
      consentMarketing: false,
      website: "",
    };
  }

  it("acepta un envío válido con el consentimiento de datos concedido", () => {
    const result = leadFormSchema.safeParse(validLead());
    expect(result.success).toBe(true);
  });

  it("rechaza el envío si no se concede el consentimiento obligatorio de envío de datos", () => {
    const result = leadFormSchema.safeParse({ ...validLead(), consentDataSharing: false });
    expect(result.success).toBe(false);
  });

  it("rechaza el envío si el campo trampa (honeypot) llega relleno", () => {
    const result = leadFormSchema.safeParse({ ...validLead(), website: "http://spam-bot.example" });
    expect(result.success).toBe(false);
  });

  it("no exige el consentimiento de marketing", () => {
    const result = leadFormSchema.safeParse({ ...validLead(), consentMarketing: false });
    expect(result.success).toBe(true);
  });
});

describe("clinicSignupSchema", () => {
  function validSignup() {
    return {
      clinicName: "Clínica Demo",
      contactName: "Juan Pérez",
      email: "juan@example.com",
      password: "Passw0rd",
      phone: "612345678",
      address: "Calle Mayor 1",
      postalCode: "28001",
      citySlug: "madrid",
      treatmentIds: ["t1"],
      acceptTerms: true,
    };
  }

  it("acepta un alta válida", () => {
    expect(clinicSignupSchema.safeParse(validSignup()).success).toBe(true);
  });

  it("rechaza una contraseña débil sin ningún número", () => {
    const result = clinicSignupSchema.safeParse({ ...validSignup(), password: "abcdefgh" });
    expect(result.success).toBe(false);
  });

  it("rechaza una contraseña débil sin ninguna letra", () => {
    const result = clinicSignupSchema.safeParse({ ...validSignup(), password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rechaza una contraseña demasiado corta", () => {
    const result = clinicSignupSchema.safeParse({ ...validSignup(), password: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rechaza el alta si no se aceptan las condiciones del servicio", () => {
    const result = clinicSignupSchema.safeParse({ ...validSignup(), acceptTerms: false });
    expect(result.success).toBe(false);
  });
});

describe("topUpSchema", () => {
  it("rechaza recargas por debajo del mínimo", () => {
    expect(topUpSchema.safeParse({ clinicId: "c1", amountEuros: 10 }).success).toBe(false);
  });

  it("rechaza importes no enteros", () => {
    expect(topUpSchema.safeParse({ clinicId: "c1", amountEuros: 50.5 }).success).toBe(false);
  });

  it("acepta una recarga válida", () => {
    expect(topUpSchema.safeParse({ clinicId: "c1", amountEuros: 100 }).success).toBe(true);
  });
});

describe("isSafeExternalUrl", () => {
  it("acepta una URL https pública", () => {
    expect(isSafeExternalUrl("https://www.clinica-demo.es")).toBe(true);
  });

  it("bloquea localhost y 127.0.0.1", () => {
    expect(isSafeExternalUrl("http://localhost:3000")).toBe(false);
    expect(isSafeExternalUrl("http://127.0.0.1")).toBe(false);
    expect(isSafeExternalUrl("http://sub.localhost")).toBe(false);
  });

  it("bloquea rangos de IP privados", () => {
    expect(isSafeExternalUrl("http://10.0.0.5")).toBe(false);
    expect(isSafeExternalUrl("http://192.168.1.1")).toBe(false);
    expect(isSafeExternalUrl("http://172.16.0.1")).toBe(false);
    expect(isSafeExternalUrl("http://169.254.1.1")).toBe(false);
  });

  it("bloquea dominios .internal y .local", () => {
    expect(isSafeExternalUrl("http://service.internal")).toBe(false);
    expect(isSafeExternalUrl("http://printer.local")).toBe(false);
  });

  it("bloquea esquemas que no sean http/https", () => {
    expect(isSafeExternalUrl("ftp://example.com/file")).toBe(false);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("file:///etc/passwd")).toBe(false);
  });

  it("rechaza cadenas que no son una URL válida", () => {
    expect(isSafeExternalUrl("no es una url")).toBe(false);
  });

  it("bloquea IPv6 loopback, link-local y unique-local", () => {
    expect(isSafeExternalUrl("http://[::1]")).toBe(false);
    expect(isSafeExternalUrl("http://[fe80::1]")).toBe(false);
    expect(isSafeExternalUrl("http://[fd12:3456:789a::1]")).toBe(false);
  });

  it("bloquea IPv4 privados disfrazados de literal IPv6 (mapeado, NAT64 o compatible)", () => {
    // ::ffff:169.254.169.254 -> metadatos de nube; normalizado por URL a ::ffff:a9fe:a9fe
    expect(isSafeExternalUrl("http://[::ffff:169.254.169.254]")).toBe(false);
    expect(isSafeExternalUrl("http://[::ffff:127.0.0.1]")).toBe(false);
    expect(isSafeExternalUrl("http://[64:ff9b::169.254.169.254]")).toBe(false);
    expect(isSafeExternalUrl("http://[::127.0.0.1]")).toBe(false);
  });

  it("bloquea IPv4 privados codificados en notación decimal, octal o hexadecimal", () => {
    expect(isSafeExternalUrl("http://2130706433")).toBe(false); // 127.0.0.1
    expect(isSafeExternalUrl("http://0x7f000001")).toBe(false); // 127.0.0.1
    expect(isSafeExternalUrl("http://017700000001")).toBe(false); // 127.0.0.1 en octal
  });

  it("sigue aceptando un literal IPv6 público", () => {
    expect(isSafeExternalUrl("http://[2001:4860:4860::8888]")).toBe(true);
  });
});
