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
    <div className={cn("card overflow-x-auto", className)}>
      <table className="data-table min-w-full text-left text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">{children}</tbody>
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
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer",
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  mono,
  align,
}: {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-5 py-3.5 text-ink",
        mono && "mono text-sm tabular-nums",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}
