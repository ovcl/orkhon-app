// Map хуудасны тусгай layout — .container wrapper-гүйгээр бүтэн дэлгэцэнд харуулна.
// Үндсэн layout.js дэхь .container нь max-width:480px + position:relative тохируулдаг
// тул position:fixed тохируулсан map canvas зөв хэмжээгээр харагдахгүй болдог.
export default function MapLayout({ children }) {
    return (
        <div style={{ position: "relative", minHeight: "100vh", background: "#070b14" }}>
            {children}
        </div>
    );
}
