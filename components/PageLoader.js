// Route шилжих үеийн нийтлэг ачаалах дэлгэц (app/**/loading.js)
export default function PageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink" role="status" aria-label="Ачаалж байна">
            <div className="w-10 h-10 rounded-full border-[3px] border-amber-500/20 border-t-amber-500 animate-spin-fast"></div>
        </div>
    );
}
