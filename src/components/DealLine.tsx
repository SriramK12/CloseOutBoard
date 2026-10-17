/** The one-line deal text: "Item · Offer". Shared by the board, vendor list and preview. */
export function DealLine({ item, offer, className = "" }: { item: string; offer: string; className?: string }) {
  return (
    <span className={`break-words ${className}`}>
      <span className="font-semibold text-forest">{item || "Item"}</span>
      <span className="text-moss">{" · "}</span>
      <span className="font-semibold text-tomato">{offer || "Deal"}</span>
    </span>
  );
}
