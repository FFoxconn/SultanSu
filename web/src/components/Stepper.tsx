import { CheckIcon } from "./icons";

export function Stepper({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
        return (
          <div className={`stepper__step stepper__step--${state}`} key={label}>
            <div className="stepper__circle">{state === "done" ? <CheckIcon size={13} /> : i + 1}</div>
            <div className="stepper__label">{label}</div>
            {i < steps.length - 1 && <div className="stepper__line" />}
          </div>
        );
      })}
    </div>
  );
}
