"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "multiple" | "size"
> & {
  multiple?: never;
  size?: never;
};

type OptionElementProps = Readonly<{
  children?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  label?: string;
  value?: string | number | readonly string[];
}>;

type SelectOption = Readonly<{
  disabled: boolean;
  key: string;
  label: string;
  value: string;
}>;

type MenuPosition = Readonly<{
  bottom?: number;
  left: number;
  maxHeight: number;
  top?: number;
  width: number;
}>;

const MENU_GAP = 6;
const MENU_MARGIN = 8;
const MENU_MAX_HEIGHT = 272;

function getNodeText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : "",
    )
    .join("")
    .trim();
}

function collectOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child, index) => {
    if (!isValidElement<OptionElementProps>(child)) {
      return [];
    }

    if (child.type === Fragment) {
      return collectOptions(child.props.children);
    }

    if (child.type !== "option" || child.props.hidden) {
      return [];
    }

    const label = child.props.label ?? getNodeText(child.props.children);
    const rawValue = child.props.value ?? label;
    const value = Array.isArray(rawValue)
      ? String(rawValue[0] ?? "")
      : String(rawValue);

    return [
      {
        disabled: Boolean(child.props.disabled),
        key: child.key === null ? `${value}-${index}` : String(child.key),
        label,
        value,
      },
    ];
  });
}

function normalizeValue(value: SelectProps["value"]): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? String(value[0] ?? "") : String(value);
}

function getInitialValue(
  options: readonly SelectOption[],
  value: SelectProps["value"],
  defaultValue: SelectProps["defaultValue"],
) {
  return (
    normalizeValue(value) ??
    normalizeValue(defaultValue) ??
    options[0]?.value ??
    ""
  );
}

function findEnabledOption(
  options: readonly SelectOption[],
  startIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) {
    return -1;
  }

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index =
      (startIndex + direction * offset + options.length) % options.length;

    if (!options[index]?.disabled) {
      return index;
    }
  }

  return -1;
}

export function Select({
  children,
  className,
  defaultValue,
  disabled = false,
  id,
  name,
  onChange,
  onInvalid,
  required = false,
  value,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const controlId = id ?? `select-${generatedId}`;
  const listboxId = `${controlId}-listbox`;
  const options = useMemo(() => collectOptions(children), [children]);
  const [internalValue, setInternalValue] = useState(() =>
    getInitialValue(options, value, defaultValue),
  );
  const selectedValue = normalizeValue(value) ?? internalValue;
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0];
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === selectedValue),
    ),
  );
  const [invalid, setInvalid] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ariaInvalid = props["aria-invalid"];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMenuPosition = () => {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const availableBelow = window.innerHeight - rect.bottom - MENU_MARGIN;
      const availableAbove = rect.top - MENU_MARGIN;
      const openAbove = availableBelow < 176 && availableAbove > availableBelow;
      const maxHeight = Math.max(
        120,
        Math.min(
          MENU_MAX_HEIGHT,
          (openAbove ? availableAbove : availableBelow) - MENU_GAP,
        ),
      );
      const left = Math.min(
        Math.max(MENU_MARGIN, rect.left),
        Math.max(MENU_MARGIN, window.innerWidth - rect.width - MENU_MARGIN),
      );

      setMenuPosition(
        openAbove
          ? {
              bottom: window.innerHeight - rect.top + MENU_GAP,
              left,
              maxHeight,
              width: rect.width,
            }
          : {
              left,
              maxHeight,
              top: rect.bottom + MENU_GAP,
              width: rect.width,
            },
      );
    };

    const closeWhenOutside = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    updateMenuPosition();
    document.addEventListener("pointerdown", closeWhenOutside);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    menuRef.current
      ?.querySelector<HTMLElement>(`[data-option-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    const select = selectRef.current;
    const form = select?.form;

    if (!select || !form || value !== undefined) {
      return;
    }

    const syncAfterReset = () => {
      window.setTimeout(() => {
        setInternalValue(getInitialValue(options, undefined, defaultValue));
        setInvalid(false);
      });
    };

    form.addEventListener("reset", syncAfterReset);
    return () => form.removeEventListener("reset", syncAfterReset);
  }, [defaultValue, options, value]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current);
      }
    },
    [],
  );

  const openMenu = (preferredIndex?: number) => {
    if (disabled || options.length === 0) {
      return;
    }

    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue && !option.disabled,
    );
    const nextIndex =
      preferredIndex ??
      (selectedIndex >= 0 ? selectedIndex : findEnabledOption(options, -1, 1));
    setActiveIndex(nextIndex);
    setIsOpen(true);
  };

  const selectOption = (option: SelectOption) => {
    if (option.disabled) {
      return;
    }

    const nativeSelect = selectRef.current;

    if (!nativeSelect) {
      return;
    }

    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(nativeSelect, option.value);
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    setInvalid(false);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const firstEnabled = findEnabledOption(options, -1, 1);
    const lastEnabled = findEnabledOption(options, 0, -1);

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const index = event.key === "Home" ? firstEnabled : lastEnabled;

      if (index >= 0) {
        openMenu(index);
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const baseIndex = isOpen
        ? activeIndex
        : options.findIndex((option) => option.value === selectedValue);
      const nextIndex = findEnabledOption(options, baseIndex, direction);

      if (nextIndex >= 0) {
        openMenu(nextIndex);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (isOpen && options[activeIndex]) {
        selectOption(options[activeIndex]);
      } else {
        openMenu();
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase("pt-BR");

      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current);
      }

      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadRef.current = "";
      }, 600);

      const matchIndex = options.findIndex(
        (option) =>
          !option.disabled &&
          option.label
            .toLocaleLowerCase("pt-BR")
            .startsWith(typeaheadRef.current),
      );

      if (matchIndex >= 0) {
        openMenu(matchIndex);
      }
    }
  };

  const menuStyle: CSSProperties | undefined = menuPosition
    ? {
        bottom: menuPosition.bottom,
        left: menuPosition.left,
        maxHeight: menuPosition.maxHeight,
        top: menuPosition.top,
        width: menuPosition.width,
      }
    : undefined;

  return (
    <div className="ui-select-shell" ref={rootRef}>
      <select
        {...props}
        className="ui-select-native"
        defaultValue={undefined}
        disabled={disabled}
        hidden
        id={`${controlId}-native`}
        name={name}
        onChange={(event) => {
          setInternalValue(event.currentTarget.value);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          setIsOpen(false);
          buttonRef.current?.focus();
          onInvalid?.(event);
        }}
        ref={selectRef}
        required={required}
        tabIndex={-1}
        value={selectedValue}
      >
        {children}
      </select>

      <button
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        aria-controls={listboxId}
        aria-describedby={props["aria-describedby"]}
        aria-errormessage={props["aria-errormessage"]}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={Boolean(ariaInvalid) || invalid || undefined}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-required={required || undefined}
        className={["ui-select", className].filter(Boolean).join(" ")}
        disabled={disabled}
        id={controlId}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        ref={buttonRef}
        role="combobox"
        type="button"
      >
        <span className="ui-select__value">{selectedOption?.label ?? ""}</span>
        <svg
          aria-hidden="true"
          className="ui-select__chevron"
          viewBox="0 0 20 20"
        >
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              aria-label="Opções disponíveis"
              aria-labelledby={props["aria-labelledby"]}
              className="ui-select-menu"
              id={listboxId}
              ref={menuRef}
              role="listbox"
              style={menuStyle}
            >
              {options.map((option, index) => {
                const isSelected = option.value === selectedValue;
                const isActive = index === activeIndex;

                return (
                  <button
                    aria-disabled={option.disabled || undefined}
                    aria-selected={isSelected}
                    className="ui-select-option"
                    data-active={isActive || undefined}
                    data-option-index={index}
                    disabled={option.disabled}
                    id={`${listboxId}-option-${index}`}
                    key={option.key}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setActiveIndex(index);
                      }
                    }}
                    onPointerDown={(event) => event.preventDefault()}
                    role="option"
                    tabIndex={-1}
                    type="button"
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <svg aria-hidden="true" viewBox="0 0 20 20">
                        <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
