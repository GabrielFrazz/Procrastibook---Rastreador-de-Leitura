import { describe, expect, it } from "vitest";

import {
  constrainAvatarSelection,
  getAvatarCropRect,
  getContainedImageRect,
} from "@/features/profile/domain/avatar-crop";

describe("avatar crop", () => {
  it("centraliza uma imagem horizontal dentro da área da modal", () => {
    expect(getContainedImageRect(1200, 800, 720, 500)).toEqual({
      height: 480,
      width: 720,
      x: 0,
      y: 10,
    });
  });

  it("mantém o círculo completamente dentro da imagem", () => {
    expect(
      constrainAvatarSelection(
        { centerX: 0, centerY: 900, radius: 180 },
        { height: 480, width: 720, x: 0, y: 10 },
      ),
    ).toEqual({ centerX: 180, centerY: 310, radius: 180 });
  });

  it("converte a seleção visível para as coordenadas da imagem original", () => {
    expect(
      getAvatarCropRect(
        1200,
        800,
        { height: 480, width: 720, x: 0, y: 10 },
        { centerX: 360, centerY: 250, radius: 120 },
      ),
    ).toEqual({ size: 400, x: 400, y: 200 });
  });
});
