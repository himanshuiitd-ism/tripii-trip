export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-28 flex flex-col gap-6">
        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 mb-3" />
            <h3 className="font-bold">Jane Doe</h3>
            <p className="text-xs text-text-muted-light">@janedoe_travels</p>
            <div className="w-full flex justify-around mt-3 border-t pt-3">
              <div className="text-center">
                <div className="font-bold">12</div>
                <div className="text-xs text-text-muted-light">Trips</div>
              </div>
              <div className="text-center">
                <div className="font-bold">5</div>
                <div className="text-xs text-text-muted-light">Communities</div>
              </div>
              <div className="text-center">
                <div className="font-bold">1.2k</div>
                <div className="text-xs text-text-muted-light">Followers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-border-light">
          <h4 className="font-bold mb-3">Suggested Places</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-gray-200" />
              <div>
                <div className="font-bold">Kyoto, Japan</div>
                <div className="text-xs text-text-muted-light">
                  Ancient temples
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
