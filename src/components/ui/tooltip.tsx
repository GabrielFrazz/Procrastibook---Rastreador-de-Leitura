"use client";

import {
  Children,
  cloneElement,
  useId,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type PointerEventHandler,
  type ReactElement,
} from "react";

type TooltipTriggerProps = Readonly<{
  "aria-describedby"?: string;
}>;

type TooltipProps = Readonly<{
  children: ReactElement<TooltipTriggerProps>;
  content: string;
  placement?: "top" | "right" | "bottom" | "left";
}>;

export function Tooltip({
  children,
  content,
  placement = "top",
}: TooltipProps) {
  const tooltipId = useId();
  const trigger = Children.only(children);
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
  const pointerInteractionRef = useRef(false);
  const describedBy = [trigger.props["aria-describedby"], tooltipId]
    .filter(Boolean)
    .join(" ");

  const handlePointerDown: PointerEventHandler<HTMLSpanElement> = () => {
    pointerInteractionRef.current = true;
    setHasKeyboardFocus(false);
  };

  const handleFocus: FocusEventHandler<HTMLSpanElement> = () => {
    setHasKeyboardFocus(!pointerInteractionRef.current);
    pointerInteractionRef.current = false;
  };

  const handleBlur: FocusEventHandler<HTMLSpanElement> = () => {
    pointerInteractionRef.current = false;
    setHasKeyboardFocus(false);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLSpanElement> = () => {
    pointerInteractionRef.current = false;
    setHasKeyboardFocus(true);
  };

  return (
    <span
      className="ui-tooltip"
      data-keyboard-focus={hasKeyboardFocus || undefined}
      data-placement={placement}
      onBlurCapture={handleBlur}
      onFocusCapture={handleFocus}
      onKeyDownCapture={handleKeyDown}
      onPointerDownCapture={handlePointerDown}
    >
      {cloneElement(trigger, { "aria-describedby": describedBy })}
      <span className="ui-tooltip__content" id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  );
}
