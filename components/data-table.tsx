type DataTableProps = {
  headers: string[];
  children: React.ReactNode;
};

export default function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 text-left">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-sm font-medium text-gray-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}