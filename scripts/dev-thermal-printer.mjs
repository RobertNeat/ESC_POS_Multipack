import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
const environment = {
  ...readEnvironmentFile(`${rootDirectory}/.env`),
  ...process.env,
};
const clientPort = readPort(environment.CLIENT_PORT, 'CLIENT_PORT');
const servicePort = readPort(environment.SERVICE_PORT, 'SERVICE_PORT');
const target = process.argv[2] ?? 'both';

if (!['both', 'client', 'service'].includes(target)) {
  throw new Error(`Unknown development target: ${target}`);
}

const children = [];

if (target === 'both' || target === 'service') {
  children.push(
    startPnpm(['--filter', 'thermal-printer-service', 'dev'], {
      ...environment,
      PORT: String(servicePort),
      SERVICE_PORT: String(servicePort),
    }),
  );
}

if (target === 'both' || target === 'client') {
  children.push(
    startPnpm(
      [
        '--filter',
        'thermal-printer-simple-client',
        'dev',
        '--port',
        String(clientPort),
      ],
      {
        ...environment,
        CLIENT_PORT: String(clientPort),
        SERVICE_PORT: String(servicePort),
      },
    ),
  );
}

for (const child of children) {
  child.once('exit', () => {
    for (const sibling of children) {
      if (sibling !== child) terminateChild(sibling);
    }
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of children) terminateChild(child, signal);
  });
}

const results = await Promise.all(
  children.map(
    (child) =>
      new Promise((resolve) => {
        child.on('exit', (code, signal) => resolve({ code, signal }));
      }),
  ),
);

const failed = results.find(
  ({ code, signal }) => code !== 0 && signal === null,
);
process.exitCode = failed?.code ?? 0;

function startPnpm(arguments_, childEnvironment) {
  const pnpmEntryPoint = process.env.npm_execpath;
  if (!pnpmEntryPoint) {
    throw new Error(
      'Run this launcher through pnpm so npm_execpath is available.',
    );
  }

  return spawn(process.execPath, [pnpmEntryPoint, ...arguments_], {
    cwd: rootDirectory,
    env: childEnvironment,
    stdio: 'inherit',
  });
}

function terminateChild(child, signal = 'SIGTERM') {
  if (child.exitCode !== null || child.pid === undefined) return;

  if (process.platform === 'win32') {
    const killer = spawn(
      'taskkill.exe',
      ['/pid', String(child.pid), '/T', '/F'],
      {
        stdio: 'ignore',
      },
    );
    killer.once('error', () => child.kill(signal));
    return;
  }

  child.kill(signal);
}

function readEnvironmentFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator < 1) throw new Error(`Invalid .env entry: ${line}`);

        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/u, '$2');
        return [key, value];
      }),
  );
}

function readPort(value, name) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `${name} must be set in the root .env file to an integer between 1 and 65535.`,
    );
  }
  return port;
}
