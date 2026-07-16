import { Children, cloneElement, useId, type ReactElement } from "react";

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
  const describedBy = [trigger.props["aria-describedby"], tooltipId]
    .filter(Boolean)
    .join(" ");

  return (
    <span className="ui-tooltip" data-placement={placement}>
      {cloneElement(trigger, { "aria-describedby": describedBy })}
      <span className="ui-tooltip__content" id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  );
}
