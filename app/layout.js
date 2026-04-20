import "./globals.css";

export const metadata = {
    title: "Orkhon Valley | Орхоны хөндий",
    description: "Орхоны хөндийн соёлын дурсгалт газрын виртуал хөтөч | Cultural Landscape Virtual Guide",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Orkhon Valley',
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#0a0f1e",
};

export default function RootLayout({ children }) {
    return (
        <html lang="mn">
            <body className="antialiased">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
                <link rel="apple-touch-icon" href="/logo.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <div className="container">
                    {children}
                </div>
            </body>
        </html>
    );
}
