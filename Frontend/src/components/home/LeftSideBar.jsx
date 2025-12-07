export default function LeftSidebar() {
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-28 flex flex-col gap-4">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-3 border border-border-light">
          <h3 className="text-xs font-bold text-text-muted-light">
            Rooms I am part of
          </h3>
          <ul className="mt-2 space-y-1">
            <li className="p-2 rounded-lg hover:bg-primary/10">
              #general-chat
            </li>
            <li className="p-2 rounded-lg hover:bg-primary/10">
              #thailand-plans
            </li>
            <li className="p-2 rounded-lg hover:bg-primary/10">
              #vietnam-loop
            </li>
          </ul>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-3 border border-border-light">
          <h3 className="text-xs font-bold text-text-muted-light">My trips</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gray-200" />
              <div>
                <div className="text-sm font-bold">Bali & Islands</div>
                <div className="text-xs text-text-muted-light">12 members</div>
              </div>
            </div>
          </div>
        </div>

        {/* orange placeholder for future feature */}
        <div className="bg-orange-100 border border-orange-300 text-orange-800 p-4 rounded-lg">
          Placeholder (future widget)
        </div>
      </div>
    </aside>
  );
}
