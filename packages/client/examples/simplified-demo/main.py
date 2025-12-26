# Copyright (c) 2025 ByteTrue
# Licensed under CC-BY-NC-4.0

"""
简化配置示例工具

演示使用简化的 booltox.json 配置（只需 4 个字段）
"""

from http.server import HTTPServer, BaseHTTPRequestHandler

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()

        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>简化配置示例</title>
            <style>
                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 30px;
                    backdrop-filter: blur(10px);
                }
                h1 { margin-top: 0; }
                code {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 2px 6px;
                    border-radius: 3px;
                }
                .config {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎉 简化配置示例工具</h1>
                <p>这是使用 <strong>简化 booltox.json 配置</strong> 的示例工具。</p>

                <h2>📝 配置文件</h2>
                <div class="config">
                    <pre>{
  "name": "简化示例工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8080
}</pre>
                </div>

                <h3>✨ 优势</h3>
                <ul>
                    <li>只需 <strong>4 个字段</strong>（vs 传统的 8+ 字段）</li>
                    <li><code>ID</code> 自动从文件夹名生成</li>
                    <li><code>runtime</code> 自动从 start 命令推断</li>
                    <li><code>backend.type</code> 自动检测（python/node/binary）</li>
                </ul>

                <h3>🚀 工作原理</h3>
                <p>BoolTox 会自动推断：</p>
                <ul>
                    <li>有 <code>port</code> → http-service 模式</li>
                    <li><code>start</code> 包含 "python" → backend.type = python</li>
                    <li>自动添加 <code>requirements.txt</code></li>
                </ul>
            </div>
        </body>
        </html>
        """

        self.wfile.write(html.encode())

    def log_message(self, format, *args):
        # 静默日志
        pass

if __name__ == '__main__':
    port = 8080
    server = HTTPServer(('127.0.0.1', port), SimpleHandler)
    print(f'✓ Server running on http://127.0.0.1:{port}')
    server.serve_forever()
