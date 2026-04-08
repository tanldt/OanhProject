import { Outlet } from "react-router-dom";

export default function Reviewer() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Outlet />
    </main>
  );
}