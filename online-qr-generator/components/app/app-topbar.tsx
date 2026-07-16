export function AppTopbar({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 flex-none items-center justify-between border-b bg-card px-6">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}
