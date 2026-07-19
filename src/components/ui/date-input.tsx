"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

type CalendarPosition = Readonly<{
  bottom?: number;
  left: number;
  top?: number;
  width: number;
}>;

const CALENDAR_GAP = 6;
const CALENDAR_MARGIN = 8;
const CALENDAR_WIDTH = 320;
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function normalizeInputValue(value: DateInputProps["value"]) {
  if (value === undefined || Array.isArray(value)) {
    return undefined;
  }

  return String(value);
}

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== (month ?? 1) - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function serializeDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  const label = monthFormatter.format(date);
  return `${label.charAt(0).toLocaleUpperCase("pt-BR")}${label.slice(1)}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0,
  ).getDate();

  return new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
}

function clampDate(date: Date, minDate: Date | null, maxDate: Date | null) {
  if (minDate && date < minDate) {
    return minDate;
  }

  if (maxDate && date > maxDate) {
    return maxDate;
  }

  return date;
}

function getCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function datesAreEqual(left: Date | null, right: Date | null) {
  return Boolean(
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate(),
  );
}

export function DateInput({
  className,
  defaultValue,
  disabled = false,
  id,
  max,
  min,
  name,
  onChange,
  onInvalid,
  readOnly = false,
  required = false,
  value,
  ...props
}: DateInputProps) {
  const generatedId = useId();
  const controlId = id ?? `date-${generatedId}`;
  const calendarId = `${controlId}-calendar`;
  const initialValue =
    normalizeInputValue(value) ?? normalizeInputValue(defaultValue) ?? "";
  const [internalValue, setInternalValue] = useState(initialValue);
  const selectedValue = normalizeInputValue(value) ?? internalValue;
  const selectedDate = parseDate(selectedValue);
  const minDate = parseDate(typeof min === "string" ? min : undefined);
  const maxDate = parseDate(typeof max === "string" ? max : undefined);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const initialActiveDate = clampDate(selectedDate ?? today, minDate, maxDate);
  const [activeDate, setActiveDate] = useState(initialActiveDate);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(initialActiveDate),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [calendarPosition, setCalendarPosition] =
    useState<CalendarPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const ariaInvalid = props["aria-invalid"];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateCalendarPosition = () => {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const width = Math.min(
        CALENDAR_WIDTH,
        window.innerWidth - CALENDAR_MARGIN * 2,
      );
      const left = Math.min(
        Math.max(CALENDAR_MARGIN, rect.left),
        Math.max(CALENDAR_MARGIN, window.innerWidth - width - CALENDAR_MARGIN),
      );
      const availableBelow = window.innerHeight - rect.bottom - CALENDAR_MARGIN;
      const availableAbove = rect.top - CALENDAR_MARGIN;
      const openAbove = availableBelow < 352 && availableAbove > availableBelow;

      setCalendarPosition(
        openAbove
          ? {
              bottom: window.innerHeight - rect.top + CALENDAR_GAP,
              left,
              width,
            }
          : {
              left,
              top: rect.bottom + CALENDAR_GAP,
              width,
            },
      );
    };

    const closeWhenOutside = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !rootRef.current?.contains(target) &&
        !calendarRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    updateCalendarPosition();
    document.addEventListener("pointerdown", closeWhenOutside);
    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);

    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      window.removeEventListener("resize", updateCalendarPosition);
      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      calendarRef.current
        ?.querySelector<HTMLElement>(
          `[data-date="${serializeDate(activeDate)}"]`,
        )
        ?.focus();
    });
  }, [activeDate, isOpen, visibleMonth]);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;

    if (!input || !form || value !== undefined) {
      return;
    }

    const syncAfterReset = () => {
      window.setTimeout(() => {
        const nextValue = normalizeInputValue(defaultValue) ?? "";
        const nextDate = parseDate(nextValue);
        setInternalValue(nextValue);
        setInvalid(false);

        if (nextDate) {
          setActiveDate(nextDate);
          setVisibleMonth(startOfMonth(nextDate));
        }
      });
    };

    form.addEventListener("reset", syncAfterReset);
    return () => form.removeEventListener("reset", syncAfterReset);
  }, [defaultValue, value]);

  const openCalendar = () => {
    if (disabled || readOnly) {
      return;
    }

    const nextActiveDate = clampDate(selectedDate ?? today, minDate, maxDate);
    setActiveDate(nextActiveDate);
    setVisibleMonth(startOfMonth(nextActiveDate));
    setIsOpen(true);
  };

  const updateValue = (nextDate: Date) => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const nextValue = serializeDate(nextDate);
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(input, nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    setInvalid(false);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const moveActiveDate = (nextDate: Date) => {
    const constrainedDate = clampDate(nextDate, minDate, maxDate);
    setActiveDate(constrainedDate);
    setVisibleMonth(startOfMonth(constrainedDate));
  };

  const handleDayKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) => {
    const mondayOffset = (date.getDay() + 6) % 7;
    const movements: Record<string, Date> = {
      ArrowDown: addDays(date, 7),
      ArrowLeft: addDays(date, -1),
      ArrowRight: addDays(date, 1),
      ArrowUp: addDays(date, -7),
      End: addDays(date, 6 - mondayOffset),
      Home: addDays(date, -mondayOffset),
      PageDown: addMonths(date, 1),
      PageUp: addMonths(date, -1),
    };
    const nextDate = movements[event.key];

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      updateValue(date);
      return;
    }

    if (nextDate) {
      event.preventDefault();
      moveActiveDate(nextDate);
    }
  };

  const calendarStyle: CSSProperties | undefined = calendarPosition
    ? {
        bottom: calendarPosition.bottom,
        left: calendarPosition.left,
        top: calendarPosition.top,
        width: calendarPosition.width,
      }
    : undefined;

  return (
    <div className="ui-date-shell" ref={rootRef}>
      <input
        {...props}
        className="ui-date-native"
        defaultValue={undefined}
        disabled={disabled}
        hidden
        id={`${controlId}-native`}
        max={max}
        min={min}
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
        readOnly={readOnly}
        ref={inputRef}
        required={required}
        type="date"
        value={selectedValue}
      />

      <button
        aria-controls={calendarId}
        aria-describedby={props["aria-describedby"]}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-invalid={Boolean(ariaInvalid) || invalid || undefined}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-required={required || undefined}
        className={["ui-input", "ui-date-input", className]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        id={controlId}
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            setIsOpen(false);
          } else if (
            !isOpen &&
            (event.key === "ArrowDown" ||
              event.key === "Enter" ||
              event.key === " ")
          ) {
            event.preventDefault();
            openCalendar();
          }
        }}
        ref={buttonRef}
        role="combobox"
        type="button"
      >
        <span
          className={selectedDate ? undefined : "ui-date-input__placeholder"}
        >
          {selectedDate
            ? shortDateFormatter.format(selectedDate)
            : "Selecionar data"}
        </span>
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5.5 2.8v2.4M14.5 2.8v2.4M3.2 7.2h13.6M4.5 4.2h11a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.7v-10a1.5 1.5 0 0 1 1.5-1.5Z" />
          <path d="M6.2 10.2h.01M10 10.2h.01M13.8 10.2h.01M6.2 13.6h.01M10 13.6h.01" />
        </svg>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              aria-label="Escolher data"
              className="ui-calendar"
              id={calendarId}
              ref={calendarRef}
              role="dialog"
              style={calendarStyle}
            >
              <header className="ui-calendar__header">
                <button
                  aria-label="Mês anterior"
                  onClick={() =>
                    setVisibleMonth((current) => addMonths(current, -1))
                  }
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="m12.5 4.5-5.5 5.5 5.5 5.5" />
                  </svg>
                </button>
                <strong>{formatMonthLabel(visibleMonth)}</strong>
                <button
                  aria-label="Próximo mês"
                  onClick={() =>
                    setVisibleMonth((current) => addMonths(current, 1))
                  }
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
                  </svg>
                </button>
              </header>

              <div aria-hidden="true" className="ui-calendar__weekdays">
                {weekdays.map((weekday) => (
                  <span key={weekday}>{weekday}</span>
                ))}
              </div>

              <div className="ui-calendar__grid" role="grid">
                {calendarDays.map((date) => {
                  const dateValue = serializeDate(date);
                  const outsideMonth =
                    date.getMonth() !== visibleMonth.getMonth();
                  const outsideRange = Boolean(
                    (minDate && date < minDate) || (maxDate && date > maxDate),
                  );
                  const isSelected = datesAreEqual(date, selectedDate);
                  const isToday = datesAreEqual(date, today);
                  const isActive = datesAreEqual(date, activeDate);

                  return (
                    <button
                      aria-current={isToday ? "date" : undefined}
                      aria-label={longDateFormatter.format(date)}
                      aria-selected={isSelected}
                      className="ui-calendar__day"
                      data-active={isActive || undefined}
                      data-date={dateValue}
                      data-outside-month={outsideMonth || undefined}
                      disabled={outsideRange}
                      key={dateValue}
                      onClick={() => updateValue(date)}
                      onFocus={() => setActiveDate(date)}
                      onKeyDown={(event) => handleDayKeyDown(event, date)}
                      role="gridcell"
                      tabIndex={isActive ? 0 : -1}
                      type="button"
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
