import { useState } from "react";
import ManageReviewers from "./ManageReviewers";

export default function OfficeSidebar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"menu" | "manage-reviewers">(
    "menu"
  );

  const closeSidebar = () => {
    setOpen(false);
    setActiveSection("menu");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-lg text-slate-700 shadow-sm hover:bg-slate-50"
        title="Open sidebar"
      >
        ☰
      </button>

      <div
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {activeSection === "menu" ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <button
                type="button"
                onClick={closeSidebar}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <button
                type="button"
                onClick={() => setActiveSection("manage-reviewers")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Manage Reviewers
              </button>
            </div>
          </>
        ) : (
          <ManageReviewers onBack={() => setActiveSection("menu")} />
        )}
      </aside>
    </>
  );
}