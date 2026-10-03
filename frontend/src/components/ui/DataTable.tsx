import { cn } from "@/lib/cn";

export function DataTable({
  headers,
  children,
  className,
}: {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-line bg-surface/90", className)}>
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-white/60 text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function DataRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(onClick && "cursor-pointer hover:bg-cyan-50/40")}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  mono,
}: {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td className={cn("px-4 py-3 text-ink", mono && "mono text-sm", className)}>
      {children}
    </td>
  );
}
