import type { LeadField, LeadValues } from "@/lib/leads";
import { LEAD_TOPICS } from "@/lib/lead-form";
import { areaClass, FieldError, fieldClass, LABEL_CLASS } from "./FieldParts";

type Props = {
  uid: string;
  values: LeadValues;
  errorFor: (field: LeadField) => string | undefined;
  errorId: (field: LeadField) => string;
  onBlur: (field: LeadField) => (event: { currentTarget: { value: string } }) => void;
};

/**
 * The extra fields of the contact variant: email, topic and message. Kept
 * apart from LeadForm so the form's submit, validation and focus logic stays
 * one readable file. All three are optional, so the form never blocks on them
 * beyond format and length.
 */
export default function ContactFields({ uid, values, errorFor, errorId, onBlur }: Props) {
  const invalid = (field: LeadField) => Boolean(errorFor(field));
  const describedBy = (field: LeadField) => (invalid(field) ? errorId(field) : undefined);

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>
          אימייל
          <input
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
            onBlur={onBlur("email")}
            defaultValue={values.email}
            placeholder="israel@gmail.com"
            className={`${fieldClass(invalid("email"))} text-end`}
          />
        </label>
        <FieldError id={errorId("email")} text={errorFor("email")} />
      </div>

      <label className={LABEL_CLASS} htmlFor={`${uid}-topic`}>
        נושא פנייה
        <select
          id={`${uid}-topic`}
          name="topic"
          defaultValue={values.topic ?? LEAD_TOPICS[0]}
          className={fieldClass(false)}
        >
          {LEAD_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>
          הודעה
          <textarea
            name="message"
            rows={4}
            aria-invalid={invalid("message")}
            aria-describedby={describedBy("message")}
            onBlur={onBlur("message")}
            defaultValue={values.message}
            className={areaClass(invalid("message"))}
          />
        </label>
        <FieldError id={errorId("message")} text={errorFor("message")} />
      </div>
    </>
  );
}
