type TableScrollProps = {
  children: React.ReactNode;
};

export default function TableScroll({ children }: TableScrollProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="w-full overflow-x-auto overscroll-x-contain touch-pan-x">
        {children}
      </div>
    </div>
  );
}