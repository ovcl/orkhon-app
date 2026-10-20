// Map хуудасны тусгай layout — .container wrapper-гүйгээр бүтэн дэлгэцэнд харуулна.
// Үндсэн layout.js дэхь .container нь max-width:480px + position:relative тохируулдаг
// тул position:fixed тохируулсан map canvas зөв хэмжээгээр харагдахгүй болдог.
export const metadata = {
    title: 'Газрын зураг · Map',
    description: 'Орхоны хөндийн дурсгалт газруудын интерактив газрын зураг, хиймэл дагуулын зураг, 3D гадаргуу.',
};

export default function MapLayout({ children }) {
    return (
        <div className="relative min-h-screen bg-ink">
            {children}
        </div>
    );
}
