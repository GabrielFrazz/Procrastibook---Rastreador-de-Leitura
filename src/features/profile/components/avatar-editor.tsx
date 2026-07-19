"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";

import { Avatar, Button, FormField } from "@/components/ui";
import {
  constrainAvatarSelection,
  getAvatarCropRect,
  getContainedImageRect,
  type AvatarCircleSelection,
  type AvatarImageRect,
} from "@/features/profile/domain/avatar-crop";
import {
  ALLOWED_AVATAR_TYPES,
  getAvatarFileError,
  MAX_AVATAR_SIZE_BYTES,
} from "@/features/profile/domain/profile-settings";

const AVATAR_OUTPUT_SIZE = 512;
const CROP_FRAME_HEIGHT = 500;
const CROP_FRAME_WIDTH = 720;

type CropStatus = "adjusting" | "applying" | "idle" | "ready";

type ImageSource = Readonly<{
  image: HTMLImageElement;
  originalName: string;
}>;

type AvatarEditorProps = Readonly<{
  avatarPath: string | null;
  avatarUrl: string | null;
  displayName: string;
  onCropPendingChange: (isPending: boolean) => void;
  serverError?: string | undefined;
}>;

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("INVALID_IMAGE"));
    image.src = source;
  });
}

function createAvatarBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("CROP_FAILED"))),
      "image/webp",
      0.9,
    );
  });
}

function revokeObjectUrl(reference: { current: string | null }) {
  if (reference.current) {
    URL.revokeObjectURL(reference.current);
    reference.current = null;
  }
}

function drawSelection(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  imageRect: AvatarImageRect,
  selection: AvatarCircleSelection,
) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("CANVAS_UNAVAILABLE");
  }

  const styles = window.getComputedStyle(canvas);
  const background = styles.getPropertyValue("--avatar-crop-background").trim();
  const overlay = styles.getPropertyValue("--avatar-crop-overlay").trim();
  const outline = styles.getPropertyValue("--avatar-crop-outline").trim();

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    imageRect.x,
    imageRect.y,
    imageRect.width,
    imageRect.height,
  );
  context.fillStyle = overlay;
  context.fillRect(imageRect.x, imageRect.y, imageRect.width, imageRect.height);

  context.save();
  context.beginPath();
  context.arc(
    selection.centerX,
    selection.centerY,
    selection.radius,
    0,
    Math.PI * 2,
  );
  context.clip();
  context.drawImage(
    image,
    imageRect.x,
    imageRect.y,
    imageRect.width,
    imageRect.height,
  );
  context.restore();

  context.beginPath();
  context.arc(
    selection.centerX,
    selection.centerY,
    selection.radius,
    0,
    Math.PI * 2,
  );
  context.lineWidth = 5;
  context.strokeStyle = outline;
  context.stroke();
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
) {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: ((clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

export function AvatarEditor({
  avatarPath,
  avatarUrl,
  displayName,
  onCropPendingChange,
  serverError,
}: AvatarEditorProps) {
  const [clientError, setClientError] = useState<string | null>(null);
  const [cropStatus, setCropStatus] = useState<CropStatus>("idle");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [selection, setSelection] = useState<AvatarCircleSelection | null>(
    null,
  );
  const [source, setSource] = useState<ImageSource | null>(null);
  const appliedSelectionRef = useRef<AvatarCircleSelection | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const croppedUrlRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionVersionRef = useRef(0);
  const sourceUrlRef = useRef<string | null>(null);
  const displayedError = clientError ?? serverError;
  const imageRect = useMemo(
    () =>
      source
        ? getContainedImageRect(
            source.image.naturalWidth,
            source.image.naturalHeight,
            CROP_FRAME_WIDTH,
            CROP_FRAME_HEIGHT,
          )
        : null,
    [source],
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isCropModalOpen || !dialog) {
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isCropModalOpen]);

  useEffect(() => {
    if (source && imageRect && selection && canvasRef.current) {
      drawSelection(canvasRef.current, source.image, imageRect, selection);
    }
  }, [imageRect, selection, source]);

  useEffect(
    () => () => {
      revokeObjectUrl(sourceUrlRef);
      revokeObjectUrl(croppedUrlRef);
    },
    [],
  );

  const closeDialog = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    setIsCropModalOpen(false);
  };

  const clearSelection = (nextPreviewUrl: string | null) => {
    selectionVersionRef.current += 1;
    appliedSelectionRef.current = null;
    revokeObjectUrl(sourceUrlRef);
    revokeObjectUrl(croppedUrlRef);
    setSelection(null);
    setSource(null);
    setPreviewUrl(nextPreviewUrl);
    setCropStatus("idle");
    onCropPendingChange(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const cancelCrop = () => {
    closeDialog();

    if (appliedSelectionRef.current && croppedUrlRef.current) {
      setSelection(appliedSelectionRef.current);
      setPreviewUrl(croppedUrlRef.current);
      setCropStatus("ready");
      onCropPendingChange(false);
      return;
    }

    clearSelection(removeAvatar ? null : avatarUrl);
  };

  const handleDialogCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    cancelCrop();
  };

  const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      cancelCrop();
    }
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelCrop();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const version = selectionVersionRef.current + 1;
    selectionVersionRef.current = version;
    setClientError(null);

    if (!file) {
      clearSelection(removeAvatar ? null : avatarUrl);
      return;
    }

    const fileError = getAvatarFileError(file);

    if (fileError) {
      input.value = "";
      setClientError(fileError);
      clearSelection(removeAvatar ? null : avatarUrl);
      return;
    }

    appliedSelectionRef.current = null;
    revokeObjectUrl(sourceUrlRef);
    revokeObjectUrl(croppedUrlRef);
    const objectUrl = URL.createObjectURL(file);
    sourceUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setRemoveAvatar(false);
    setCropStatus("adjusting");
    onCropPendingChange(true);

    try {
      const image = await loadImage(objectUrl);

      if (selectionVersionRef.current !== version) {
        return;
      }

      const nextImageRect = getContainedImageRect(
        image.naturalWidth,
        image.naturalHeight,
        CROP_FRAME_WIDTH,
        CROP_FRAME_HEIGHT,
      );
      const radius = Math.min(nextImageRect.width, nextImageRect.height) * 0.3;
      setSource({ image, originalName: file.name });
      setSelection({
        centerX: nextImageRect.x + nextImageRect.width / 2,
        centerY: nextImageRect.y + nextImageRect.height / 2,
        radius,
      });
      setIsCropModalOpen(true);
    } catch {
      if (selectionVersionRef.current !== version) {
        return;
      }

      setClientError(
        "Não foi possível abrir esta imagem. Escolha outro arquivo.",
      );
      clearSelection(avatarUrl);
    }
  };

  const markCropAsAdjusted = (nextSelection: AvatarCircleSelection) => {
    if (!imageRect) {
      return;
    }

    setSelection(constrainAvatarSelection(nextSelection, imageRect));
    setCropStatus("adjusting");
    onCropPendingChange(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!selection) {
      return;
    }

    const point = getCanvasPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    const distance = Math.hypot(
      point.x - selection.centerX,
      point.y - selection.centerY,
    );

    if (distance > selection.radius) {
      return;
    }

    dragOffsetRef.current = {
      x: point.x - selection.centerX,
      y: point.y - selection.centerY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selection) {
      return;
    }

    const point = getCanvasPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );
    markCropAsAdjusted({
      ...selection,
      centerX: point.x - dragOffsetRef.current.x,
      centerY: point.y - dragOffsetRef.current.y,
    });
  };

  const stopDragging = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  };

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!selection || !event.key.startsWith("Arrow")) {
      return;
    }

    event.preventDefault();
    const distance = event.shiftKey ? 12 : 4;
    const movement = {
      ArrowDown: { x: 0, y: distance },
      ArrowLeft: { x: -distance, y: 0 },
      ArrowRight: { x: distance, y: 0 },
      ArrowUp: { x: 0, y: -distance },
    }[event.key];

    if (movement) {
      markCropAsAdjusted({
        ...selection,
        centerX: selection.centerX + movement.x,
        centerY: selection.centerY + movement.y,
      });
    }
  };

  const applyCrop = async () => {
    const input = inputRef.current;

    if (!input || !source || !imageRect || !selection) {
      return;
    }

    setCropStatus("applying");
    setClientError(null);

    try {
      const rect = getAvatarCropRect(
        source.image.naturalWidth,
        source.image.naturalHeight,
        imageRect,
        selection,
      );
      const output = document.createElement("canvas");
      output.width = AVATAR_OUTPUT_SIZE;
      output.height = AVATAR_OUTPUT_SIZE;
      const context = output.getContext("2d");

      if (!context) {
        throw new Error("CANVAS_UNAVAILABLE");
      }

      context.drawImage(
        source.image,
        rect.x,
        rect.y,
        rect.size,
        rect.size,
        0,
        0,
        output.width,
        output.height,
      );
      const blob = await createAvatarBlob(output);

      if (blob.size > MAX_AVATAR_SIZE_BYTES) {
        throw new Error("CROP_TOO_LARGE");
      }

      const croppedFile = new File([blob], "avatar-recortado.webp", {
        lastModified: Date.now(),
        type: "image/webp",
      });
      const transfer = new DataTransfer();
      transfer.items.add(croppedFile);
      input.files = transfer.files;

      revokeObjectUrl(croppedUrlRef);
      const croppedUrl = URL.createObjectURL(croppedFile);
      croppedUrlRef.current = croppedUrl;
      appliedSelectionRef.current = selection;
      setPreviewUrl(croppedUrl);
      setCropStatus("ready");
      onCropPendingChange(false);
      closeDialog();
    } catch {
      setClientError("Não foi possível aplicar o recorte. Tente outra imagem.");
      setCropStatus("adjusting");
      onCropPendingChange(true);
    }
  };

  const handleRemoveAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const shouldRemove = event.currentTarget.checked;
    setRemoveAvatar(shouldRemove);
    setClientError(null);
    closeDialog();
    clearSelection(shouldRemove ? null : avatarUrl);
  };

  const maximumRadius = imageRect
    ? Math.min(imageRect.width, imageRect.height) / 2
    : 48;
  const minimumRadius = Math.min(48, maximumRadius);

  return (
    <div className="profile-avatar-editor">
      <Avatar
        alt={`Prévia do avatar de ${displayName}`}
        className="profile-avatar-preview"
        name={displayName}
        size="lg"
        src={previewUrl}
      />

      <div className="profile-avatar-fields">
        <FormField
          error={displayedError ?? undefined}
          hint="JPEG, PNG ou WebP, com no máximo 2 MB."
          htmlFor="profile-avatar"
          label="Avatar"
        >
          <input
            accept={ALLOWED_AVATAR_TYPES.join(",")}
            aria-describedby={
              displayedError ? "profile-avatar-error" : "profile-avatar-hint"
            }
            aria-invalid={Boolean(displayedError) || undefined}
            className="ui-input"
            id="profile-avatar"
            name="avatar"
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />
        </FormField>

        <div className="profile-avatar-fields__actions">
          {source && cropStatus === "ready" ? (
            <Button
              onClick={() => setIsCropModalOpen(true)}
              size="sm"
              variant="secondary"
            >
              Ajustar recorte
            </Button>
          ) : null}

          {avatarPath ? (
            <label className="profile-remove-avatar">
              <input
                checked={removeAvatar}
                name="removeAvatar"
                onChange={handleRemoveAvatar}
                type="checkbox"
                value="true"
              />
              <span>Remover o avatar atual</span>
            </label>
          ) : null}
        </div>

        {cropStatus === "ready" ? (
          <p className="profile-avatar-ready" role="status">
            Recorte pronto para salvar.
          </p>
        ) : null}
      </div>

      {source && selection ? (
        <dialog
          aria-labelledby="avatar-crop-dialog-title"
          className="profile-avatar-dialog"
          onCancel={handleDialogCancel}
          onClick={handleDialogClick}
          onClose={() => setIsCropModalOpen(false)}
          onKeyDown={handleDialogKeyDown}
          ref={dialogRef}
        >
          <header className="profile-avatar-dialog__header">
            <h2 id="avatar-crop-dialog-title">Ajustar imagem</h2>
            <button
              aria-label="Fechar ajuste de avatar"
              className="profile-avatar-dialog__close"
              onClick={cancelCrop}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="profile-avatar-dialog__body">
            <canvas
              aria-describedby="avatar-crop-instructions"
              aria-label="Área de recorte do avatar"
              className={isDragging ? "is-dragging" : undefined}
              height={CROP_FRAME_HEIGHT}
              onKeyDown={handleCanvasKeyDown}
              onPointerCancel={stopDragging}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              ref={canvasRef}
              role="application"
              tabIndex={0}
              width={CROP_FRAME_WIDTH}
            />
            <p className="sr-only" id="avatar-crop-instructions">
              Arraste o círculo sobre a imagem. Use as setas para ajustes finos
              e Shift com as setas para movimentos maiores.
            </p>
          </div>

          <footer className="profile-avatar-dialog__footer">
            <label className="profile-avatar-size" htmlFor="avatar-crop-size">
              <span className="sr-only">Tamanho da área</span>
              <input
                id="avatar-crop-size"
                max={maximumRadius}
                min={minimumRadius}
                onChange={(event) =>
                  markCropAsAdjusted({
                    ...selection,
                    radius: Number(event.currentTarget.value),
                  })
                }
                type="range"
                value={selection.radius}
              />
            </label>

            <div className="profile-avatar-dialog__actions">
              <Button onClick={cancelCrop} variant="ghost">
                Cancelar
              </Button>
              <Button
                data-avatar-apply
                isLoading={cropStatus === "applying"}
                onClick={applyCrop}
              >
                {cropStatus === "applying" ? "Aplicando…" : "Usar recorte"}
              </Button>
            </div>
          </footer>
        </dialog>
      ) : null}
    </div>
  );
}
