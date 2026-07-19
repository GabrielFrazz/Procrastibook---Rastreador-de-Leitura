export type AvatarCircleSelection = Readonly<{
  centerX: number;
  centerY: number;
  radius: number;
}>;

export type AvatarImageRect = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

export type AvatarCropRect = Readonly<{
  size: number;
  x: number;
  y: number;
}>;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getContainedImageRect(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): AvatarImageRect {
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const scale = Math.min(
    frameWidth / safeImageWidth,
    frameHeight / safeImageHeight,
  );
  const width = safeImageWidth * scale;
  const height = safeImageHeight * scale;

  return {
    height,
    width,
    x: (frameWidth - width) / 2,
    y: (frameHeight - height) / 2,
  };
}

export function constrainAvatarSelection(
  selection: AvatarCircleSelection,
  imageRect: AvatarImageRect,
): AvatarCircleSelection {
  const maximumRadius = Math.min(imageRect.width, imageRect.height) / 2;
  const radius = clamp(
    selection.radius,
    Math.min(48, maximumRadius),
    maximumRadius,
  );

  return {
    centerX: clamp(
      selection.centerX,
      imageRect.x + radius,
      imageRect.x + imageRect.width - radius,
    ),
    centerY: clamp(
      selection.centerY,
      imageRect.y + radius,
      imageRect.y + imageRect.height - radius,
    ),
    radius,
  };
}

export function getAvatarCropRect(
  imageWidth: number,
  imageHeight: number,
  imageRect: AvatarImageRect,
  selection: AvatarCircleSelection,
): AvatarCropRect {
  const constrainedSelection = constrainAvatarSelection(selection, imageRect);
  const scale = Math.max(1, imageWidth) / imageRect.width;
  const size = constrainedSelection.radius * 2 * scale;

  return {
    size: Math.min(size, Math.max(1, imageWidth), Math.max(1, imageHeight)),
    x:
      (constrainedSelection.centerX -
        constrainedSelection.radius -
        imageRect.x) *
      scale,
    y:
      (constrainedSelection.centerY -
        constrainedSelection.radius -
        imageRect.y) *
      scale,
  };
}
