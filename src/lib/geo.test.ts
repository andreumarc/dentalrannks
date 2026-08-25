import { describe, expect, it } from "vitest";
import { haversineKm, formatDistance, boundingBox } from "./geo";

const MADRID = { lat: 40.4168, lng: -3.7038 };
const BARCELONA = { lat: 41.3851, lng: 2.1734 };

describe("haversineKm", () => {
  it("calcula la distancia Madrid-Barcelona con un margen de ±10 km", () => {
    const distance = haversineKm(MADRID, BARCELONA);
    expect(distance).toBeGreaterThan(505 - 10);
    expect(distance).toBeLessThan(505 + 10);
  });

  it("devuelve 0 para el mismo punto", () => {
    expect(haversineKm(MADRID, MADRID)).toBeCloseTo(0, 6);
  });

  it("es simétrica: la distancia A→B es igual a B→A", () => {
    const ab = haversineKm(MADRID, BARCELONA);
    const ba = haversineKm(BARCELONA, MADRID);
    expect(ab).toBeCloseTo(ba, 9);
  });
});

describe("formatDistance", () => {
  it("formatea distancias inferiores a 1 km en metros", () => {
    expect(formatDistance(0.35)).toBe("350 m");
  });

  it("formatea distancias entre 1 y 10 km con un decimal (coma española)", () => {
    expect(formatDistance(4.2)).toBe("4,2 km");
  });

  it("formatea distancias de 10 km o más como número entero", () => {
    expect(formatDistance(23.6)).toBe("24 km");
    expect(formatDistance(505)).toBe("505 km");
  });
});

describe("boundingBox", () => {
  it("produce una caja coherente que contiene el centro", () => {
    const box = boundingBox(MADRID, 20);
    expect(box.minLat).toBeLessThan(MADRID.lat);
    expect(box.maxLat).toBeGreaterThan(MADRID.lat);
    expect(box.minLng).toBeLessThan(MADRID.lng);
    expect(box.maxLng).toBeGreaterThan(MADRID.lng);
  });

  it("es simétrica respecto al centro", () => {
    const box = boundingBox(MADRID, 15);
    expect(MADRID.lat - box.minLat).toBeCloseTo(box.maxLat - MADRID.lat, 9);
    expect(MADRID.lng - box.minLng).toBeCloseTo(box.maxLng - MADRID.lng, 9);
  });

  it("una caja más grande crece con el radio", () => {
    const small = boundingBox(MADRID, 5);
    const large = boundingBox(MADRID, 50);
    expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat);
  });

  it("puntos dentro de la caja quedan a una distancia aproximadamente menor que el radio en línea recta", () => {
    const radiusKm = 25;
    const box = boundingBox(MADRID, radiusKm);
    const cornerNear = { lat: box.maxLat, lng: MADRID.lng };
    const distance = haversineKm(MADRID, cornerNear);
    // El límite en latitud es exacto por construcción (no depende del coseno).
    expect(distance).toBeCloseTo(radiusKm, 0);
  });
});
