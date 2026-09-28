import * as React from "react";

type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectControlProps<T extends string | number> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

export default function SelectControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectControlProps<T>) {
  const fieldId = React.useId();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => Object.is(option.value, value)),
  );
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex);
  const selectedOption = options[selectedIndex] ?? options[0];

  React.useEffect(() => {
    if (isOpen) {
      setActiveIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);

  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);

    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

  const chooseOption = (nextIndex: number) => {
    const nextOption = options[nextIndex];

    if (!nextOption) {
      return;
    }

    onChange(nextOption.value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const moveActiveOption = (direction: number) => {
    setActiveIndex((current) => (current + direction + options.length) % options.length);
  };

  return (
    <div className={`select-field${isOpen ? " is-open" : ""}`} ref={rootRef}>
      <span className="select-field-label" id={`${fieldId}-label`}>
        {label}
      </span>
      <button
        aria-controls={`${fieldId}-listbox`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${fieldId}-label ${fieldId}-value`}
        className="themed-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(selectedIndex);
              return;
            }
            moveActiveOption(1);
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIndex(selectedIndex);
              return;
            }
            moveActiveOption(-1);
          }

          if (event.key === "Home" && isOpen) {
            event.preventDefault();
            setActiveIndex(0);
          }

          if (event.key === "End" && isOpen) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (isOpen) {
              chooseOption(activeIndex);
              return;
            }
            setIsOpen(true);
          }

          if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            setIsOpen(false);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        <span id={`${fieldId}-value`}>{selectedOption?.label}</span>
        <span className="themed-select-arrow" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="themed-select-list" id={`${fieldId}-listbox`} role="listbox">
          {options.map((option, index) => (
            <button
              aria-selected={Object.is(option.value, value)}
              className={index === activeIndex ? "is-active" : ""}
              id={`${fieldId}-option-${index}`}
              key={String(option.value)}
              onClick={() => chooseOption(index)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
