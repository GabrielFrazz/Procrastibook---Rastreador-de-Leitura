import { describe, expect, it } from "vitest";

import {
  getAvatarFileError,
  MAX_AVATAR_SIZE_BYTES,
} from "@/features/profile/domain/profile-settings";

describe("getAvatarFileError", () => {
  it("aceita imagens suportadas dentro do limite", () => {
    const file = new File([new Uint8Array(32)], "avatar.png", {
      type: "image/png",
    });

    expect(getAvatarFileError(file)).toBeNull();
  });

  it("rejeita formatos não suportados", () => {
    const file = new File([new Uint8Array(32)], "avatar.gif", {
      type: "image/gif",
    });

    expect(getAvatarFileError(file)).toBe("Use uma imagem JPEG, PNG ou WebP.");
  });

  it("rejeita imagens acima de 2 MB", () => {
    const file = new File(
      [new Uint8Array(MAX_AVATAR_SIZE_BYTES + 1)],
      "avatar.jpg",
      { type: "image/jpeg" },
    );

    expect(getAvatarFileError(file)).toBe("O avatar deve ter no máximo 2 MB.");
  });
});
