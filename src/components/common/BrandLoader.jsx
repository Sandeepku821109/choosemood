const BrandLoader = ({ label = 'Loading', fullScreen = false }) => (
    <div className={`${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'} flex flex-col items-center justify-center bg-white px-4`}>
        <div className="relative mb-5">
            <div className="w-14 h-14 rounded-full border-4 border-[#E72744]/20 border-t-[#E72744] animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E72744] animate-pulse"></span>
            </span>
        </div>
        <p className="text-xl font-extrabold tracking-widest text-gray-900">
            Choose<span className="text-[#E72744]">Mood</span>
        </p>
        <p className="mt-2 text-sm text-gray-500">{label}...</p>
    </div>
)

export default BrandLoader
