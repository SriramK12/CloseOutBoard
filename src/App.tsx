import { DemoBar } from "./components/DemoBar";
import { useRoute } from "./lib/router";
import { ManagerView } from "./views/ManagerView";
import { ShopperBoard } from "./views/ShopperBoard";
import { VendorView } from "./views/VendorView";

export function App() {
  const route = useRoute();
  return (
    <>
      <DemoBar route={route} />
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <img src="./favicon.svg" alt="" width={26} height={26} className="rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight">Close-out Board</span>
        </div>
      </div>
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-24">
        {route === "vendor" ? <VendorView /> : route === "manager" ? <ManagerView /> : <ShopperBoard />}
      </main>
    </>
  );
}
