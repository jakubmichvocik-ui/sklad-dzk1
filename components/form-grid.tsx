type FormGridProps = {
  children: React.ReactNode;
};

export default function FormGrid({ children }: FormGridProps) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}