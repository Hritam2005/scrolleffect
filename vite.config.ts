import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import https from 'https';

function driveProxyPlugin() {
  return {
    name: 'drive-proxy',
    configureServer(server) {
      server.middlewares.use('/api/video', (req, res) => {
        const driveUrl = 'https://drive.google.com/uc?export=download&id=1-DWirMJ-2cOfe9jaTG0S_Vaa3Zkg1oGc';
        
        https.get(driveUrl, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            // Follow the redirect manually to bypass browser CORS on 303
            https.get(response.headers.location, (redirectRes) => {
              res.writeHead(redirectRes.statusCode || 200, {
                'Content-Type': redirectRes.headers['content-type'] || 'video/mp4',
                'Access-Control-Allow-Origin': '*'
              });
              redirectRes.pipe(res);
            }).on('error', (err) => {
              res.statusCode = 500;
              res.end('Error fetching video');
            });
          } else {
            res.writeHead(response.statusCode || 200, response.headers);
            response.pipe(res);
          }
        }).on('error', (err) => {
          res.statusCode = 500;
          res.end('Error fetching from Drive');
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), driveProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
