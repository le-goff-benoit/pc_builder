/** A labelled form control. The <label> wraps its child for implicit focus. */
export function Field({
  label,
  mono = false,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={mono ? 'field field--num' : 'field'}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}
