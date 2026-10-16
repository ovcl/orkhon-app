// Локал production шалгалт: .next-preview фолдерт build хийж 3001 портоор ажиллуулна.
// `npm run dev` (3000, .next) зэрэг ажиллаж байсан ч бие биенээ эвдэхгүй.
import { spawnSync, spawn } from 'node:child_process';

const env = { ...process.env, NEXT_DIST_DIR: '.next-preview' };
const opts = { stdio: 'inherit', env, shell: true };

const build = spawnSync('npm run build', opts);
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn('npx next start -p 3001', opts);
server.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.kill(sig));
