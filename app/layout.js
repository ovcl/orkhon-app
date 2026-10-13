import { Inter, Playfair_Display } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import AmbientBackground from "../components/AmbientBackground";
import Providers from "../components/Providers";

// Фонт, icon-ыг build үед татаж өөрийн серверээс өгнө — офлайн/киоскод CDN хэрэггүй
const inter = Inter({
    subsets: ["latin", "cyrillic", "cyrillic-ext"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-inter",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin", "cyrillic"],
    weight: ["400", "600", "700"],
    style: ["normal", "italic"],
    variable: "--font-playfair",
    display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const description =
    "Орхоны хөндийн соёлын дурсгалт газрын виртуал хөтөч — VR панорама, 3D загвар, газрын зураг, офлайн горим. UNESCO Дэлхийн өв. | Orkhon Valley Cultural Landscape virtual guide.";

export const metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Orkhon Valley | Орхоны хөндий",
        template: "%s | Орхоны хөндий",
    },
    description,
    applicationName: "Orkhon Valley Guide",
    manifest: "/manifest.json",
    keywords: ["Орхоны хөндий", "Orkhon Valley", "UNESCO", "World Heritage", "Хархорум", "Karakorum", "Эрдэнэ Зуу", "VR", "Mongolia"],
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Orkhon Valley",
    },
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
    openGraph: {
        type: "website",
        siteName: "Orkhon Valley | Орхоны хөндий",
        title: "Orkhon Valley | Орхоны хөндий",
        description,
        locale: "mn_MN",
        alternateLocale: ["en_US"],
        images: [{ url: "/hero.jpg", alt: "Orkhon Valley" }],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#070b14",
};

export default function RootLayout({ children }) {
    return (
        <html lang="mn" className={`${inter.variable} ${playfair.variable}`}>
            <body className="antialiased">
                <AmbientBackground />
                <Providers>
                    <div className="container">{children}</div>
                </Providers>
            </body>
        </html>
    );
}
