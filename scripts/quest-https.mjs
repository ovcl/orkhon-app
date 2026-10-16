// Quest / Pico шилний хөтчөөр локал dev серверийг үзэх HTTPS гүүр.
// WebXR (VR горим) зөвхөн HTTPS дээр ажилладаг тул https://<компьютерийн-IP>:3443 →
// http://localhost:3000 руу дамжуулна. Анх ажиллахад .cert/ дотор өөрөө гарын үсэг
// зурсан гэрчилгээ үүсгэнэ (шилний хөтөч дээр "Advanced → Proceed" дарна).
//
//   npm run dev      (нэг терминалд)
//   npm run quest    (өөр терминалд)
import https from 'node:https';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PORT = 3443;
const TARGET = Number(process.env.QUEST_TARGET_PORT) || 3000;

const lanIps = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

const CERT_DIR = '.cert';
const KEY = `${CERT_DIR}/quest-key.pem`;
const CERT = `${CERT_DIR}/quest-cert.pem`;
if (!existsSync(KEY) || !existsSync(CERT)) {
    mkdirSync(CERT_DIR, { recursive: true });
    const san = ['DNS:localhost', ...lanIps.map((ip) => `IP:${ip}`)].join(',');
    // Windows PowerShell-д openssl PATH-д байхгүй байж болно — Git for Windows-ынхыг ашиглана
    const gitOpenssl = [
        'C:/Program Files/Git/usr/bin/openssl.exe',
        'C:/Program Files/Git/mingw64/bin/openssl.exe',
    ].find((p) => existsSync(p));
    execFileSync(
        gitOpenssl || 'openssl',
        ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', KEY, '-out', CERT, '-days', '365', '-subj', '/CN=orkhon-dev', '-addext', `subjectAltName=${san}`],
        { stdio: 'ignore', env: { ...process.env, MSYS_NO_PATHCONV: '1' } }
    );
}

const server = https.createServer({ key: readFileSync(KEY), cert: readFileSync(CERT) }, (req, res) => {
    const upstream = http.request({ host: '127.0.0.1', port: TARGET, path: req.url, method: req.method, headers: req.headers }, (r) => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
    });
    upstream.on('error', () => {
        res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`localhost:${TARGET} дээр сервер ажиллахгүй байна — эхлээд "npm run dev" асаана уу.`);
    });
    req.pipe(upstream);
});

// Next.js dev-ийн HMR websocket
server.on('upgrade', (req, socket, head) => {
    const up = net.connect(TARGET, '127.0.0.1', () => {
        const lines = [`${req.method} ${req.url} HTTP/1.1`, ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`)];
        up.write(lines.join('\r\n') + '\r\n\r\n');
        up.write(head);
        up.pipe(socket);
        socket.pipe(up);
    });
    up.on('error', () => socket.destroy());
    socket.on('error', () => up.destroy());
});

server.on('tlsClientError', () => {});
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Quest HTTPS гүүр → localhost:${TARGET}`);
    for (const ip of lanIps) console.log(`  Шилний хөтөчид нээх: https://${ip}:${PORT}/tours`);
});
