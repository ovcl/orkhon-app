/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
                heading: ['var(--font-playfair)', '"Playfair Display"', 'serif'],
            },
            // ОВЦЛ апп-ын өнгөний token-ууд — inline `style={{ background: 'rgba(...)' }}`-ийн оронд
            // `bg-surface/70` гэх мэтээр ашиглана (opacity-г /NN-ээр).
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                ink: "rgb(7 11 20 / <alpha-value>)", // #070b14 — үндсэн дэвсгэр
                surface: "rgb(16 24 48 / <alpha-value>)", // карт, самбар
                navy: "rgb(10 14 26 / <alpha-value>)", // газрын зургийн хяналт, nav
                glass: "rgb(10 10 14 / <alpha-value>)", // панорама дээрх товч
            },
            // Кодод ашиглагдсан боловч Tailwind-ийн default scale-д байхгүй байсан тул
            // `border-white/6`, `scale-108` г.м. class огт үүсдэггүй байсан (хүрээ тод саарал харагддаг байсан)
            opacity: { 6: '0.06', 7: '0.07', 8: '0.08', 12: '0.12' },
            scale: { 108: '1.08' },
            animation: {
                "spin-fast": "spin 0.8s linear infinite",
            },
        },
    },
    plugins: [],
}
