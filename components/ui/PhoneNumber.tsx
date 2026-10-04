import { Fragment } from "react";

/**
 * A phone number that may wrap between its digit groups.
 *
 * Line breaking never breaks at a hyphen that is followed by a digit, so
 * "073-729-66-99" is one unbreakable run. At the default size it fits
 * anywhere it is used; with the reader's text at 200% on a 320px phone it is
 * wider than the column and pushed the lead card off the screen. A <wbr>
 * after each hyphen allows a break between groups (never inside one) and
 * changes nothing that is read, copied or dialled. The groups share one span:
 * most call sites are flex links, where a bare <wbr> would be a flex item of
 * its own and could never break the line.
 */
export default function PhoneNumber({ value }: { value: string }) {
  const groups = value.split("-");
  return (
    <span>
      {groups.map((group, index) => (
        <Fragment key={`${group}-${index}`}>
          {group}
          {index < groups.length - 1 ? (
            <>
              -<wbr />
            </>
          ) : null}
        </Fragment>
      ))}
    </span>
  );
}
