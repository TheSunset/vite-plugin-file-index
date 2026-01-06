import path from "path";
import fs from "fs";
import url from "url";

export default function vitePluginFileIndex() {
  return {
    name: "file-index",
    version: "1.0.0",
    apply: "serve",
    configureServer(server) {
      {
        server.middlewares.use((req, res, next) => {
          const parsedUrl = url.parse(req.url);
          const urlPath = parsedUrl.pathname;

          // 解码 URL 路径
          const decodedPath = decodeURIComponent(urlPath);

          req.url = decodeURIComponent(req.url)
          // 构建实际文件系统路径
          const rootDir = process.cwd();
          let filePath = path.join(rootDir, decodedPath);

          // 安全性检查：确保路径在根目录内
          if (!filePath.startsWith(rootDir)) {
            res.statusCode = 403;
            res.end("Forbidden");
            return;
          }

          // 检查路径是否存在
          if (!fs.existsSync(filePath)) {
            next(); // 交给 Vite 处理 404
            return;
          }

          const stats = fs.statSync(filePath);

          // 如果是文件，交给 Vite 处理
          if (stats.isFile()) {
            next();
            return;
          }

          // 如果是目录，显示目录内容
          if (stats.isDirectory()) {
            // 检查目录中是否有 index.html
            const indexPath = path.join(filePath, "index.html");
            if (fs.existsSync(indexPath)) {
              next(); // 有 index.html，交给 Vite 处理 SPA
              return;
            }

            try {
              const files = fs.readdirSync(filePath);

              // 生成面包屑导航
              const breadcrumbs = generateBreadcrumbs(decodedPath);

              // 生成文件列表
              // const fileList = generateFileListHTML(files, filePath, decodedPath);

              const html = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>目录: ${decodedPath}</title>
                    <style>
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                      }
                      .container {
                        max-width: 1000px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        overflow: hidden;
                      }
                      .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                      }
                      .header h1 {
                        margin: 0;
                        font-size: 28px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                      }
                      .header h1:before {
                        content: '📁';
                        font-size: 36px;
                      }
                      .breadcrumb {
                        margin-top: 10px;
                        font-size: 14px;
                        opacity: 0.9;
                      }
                      .breadcrumb a {
                        color: white;
                        text-decoration: none;
                        transition: opacity 0.2s;
                      }
                      .breadcrumb a:hover {
                        opacity: 0.8;
                        text-decoration: underline;
                      }
                      .content {
                        padding: 30px;
                      }
                      .file-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                      }
                      .file-item {
                        display: flex;
                        align-items: center;
                        padding: 15px;
                        border-bottom: 1px solid #eee;
                        transition: background 0.2s;
                        text-decoration: none;
                        color: #333;
                      }
                      .file-item:hover {
                        background: #f8f9fa;
                        border-radius: 8px;
                      }
                      .file-icon {
                        width: 40px;
                        text-align: center;
                        font-size: 24px;
                        margin-right: 15px;
                      }
                      .file-info {
                        flex: 1;
                      }
                      .file-name {
                        font-weight: 500;
                        font-size: 16px;
                      }
                      .file-meta {
                        font-size: 12px;
                        color: #666;
                        margin-top: 4px;
                        display: flex;
                        gap: 15px;
                      }
                      .file-size {
                        font-family: 'Monaco', 'Menlo', monospace;
                      }
                      .folder .file-name {
                        color: #667eea;
                        font-weight: 600;
                      }
                      .parent-dir {
                        background: #f8f9fa;
                        border-radius: 8px;
                        margin-bottom: 20px;
                      }
                      .parent-dir .file-name {
                        color: #764ba2;
                      }
                      .empty-dir {
                        text-align: center;
                        color: #666;
                        padding: 40px;
                        font-size: 18px;
                      }
                      .actions {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                      }
                      .btn {
                        padding: 8px 16px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        text-decoration: none;
                        display: inline-block;
                      }
                      .btn:hover {
                        background: #764ba2;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>${path.basename(filePath) || "根目录"}</h1>
                        <div class="breadcrumb">
                          ${breadcrumbs}
                        </div>
                      </div>
                      
                      <div class="content">
                        ${
                          files.length === 0
                            ? '<div class="empty-dir">📭 空目录</div>'
                            : generateFileListHTML(files, filePath, decodedPath)
                        }
                      </div>
                    </div>
                    
                    <script>
                      // 文件类型图标映射
                      const iconMap = {
                        'js': '📄', 'ts': '📄', 'jsx': '📄', 'tsx': '📄',
                        'html': '🌐', 'css': '🎨', 'scss': '🎨', 'less': '🎨',
                        'json': '📋', 'md': '📝', 'txt': '📝',
                        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
                        'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗', 'xlsx': '📗',
                        'zip': '📦', 'rar': '📦', 'tar': '📦', 'gz': '📦',
                        'mp3': '🎵', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
                        'folder': '📁', 'parent': '📂'
                      }
                      
                      // 为文件添加图标
                      document.querySelectorAll('.file-item').forEach(item => {
                        const fileName = item.querySelector('.file-name').textContent
                        const icon = item.querySelector('.file-icon')
                        const ext = fileName.split('.').pop().toLowerCase()
                        
                        if (item.classList.contains('folder')) {
                          icon.textContent = iconMap.folder
                        } else if (iconMap[ext]) {
                          icon.textContent = iconMap[ext]
                        } else {
                          icon.textContent = '📄'
                        }
                      })
                      
                      // 双击文件夹在新窗口打开
                      document.querySelectorAll('.folder').forEach(folder => {
                        folder.addEventListener('dblclick', (e) => {
                          if (e.target.closest('a')) {
                            window.open(folder.href, '_blank')
                          }
                        })
                      })
                      
                      // Ctrl+点击在新标签页打开
                      document.querySelectorAll('.file-item[href]').forEach(link => {
                        link.addEventListener('click', (e) => {
                          if (e.ctrlKey || e.metaKey) {
                            e.preventDefault()
                            window.open(link.href, '_blank')
                          }
                        })
                      })
                    </script>
                  </body>
                  </html>
                `;

              res.setHeader("Content-Type", "text/html;charset=utf-8");
              res.end(html);
              return; // 响应结束，不调用 next()
            } catch (error) {
              console.error("读取目录失败:", error);
              res.statusCode = 500;
              res.end("Internal Server Error");
              return;
            }
          }

          // 其他情况交给 Vite
          next();
        });
      }
    },
  };
}

// 生成面包屑导航
function generateBreadcrumbs(currentPath) {
  const parts = currentPath.split("/").filter(p => p);
  let breadcrumb = '<a href="/">🏠 根目录</a>';

  let accumulatedPath = "";
  for (let i = 0; i < parts.length; i++) {
    accumulatedPath += "/" + parts[i];
    breadcrumb += ` / <a href="${accumulatedPath}">${parts[i]}</a>`;
  }

  return breadcrumb;
}

// 生成文件列表 HTML
function generateFileListHTML(files, dirPath, currentUrl) {
  let html = "";

  // 排序：目录在前，文件在后，按字母顺序
  const sortedFiles = files.sort((a, b) => {
    const aPath = path.join(dirPath, a);
    const bPath = path.join(dirPath, b);
    const aIsDir = fs.statSync(aPath).isDirectory();
    const bIsDir = fs.statSync(bPath).isDirectory();

    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  // 添加上级目录链接（如果不是根目录）
  if (currentUrl !== "/") {
    const parentUrl = path.dirname(currentUrl === "/" ? "/" : currentUrl.slice(0, -1));
    html += `
      <a href="${parentUrl === "." ? "/" : parentUrl}" class="file-item parent-dir">
        <div class="file-icon">📂</div>
        <div class="file-info">
          <div class="file-name">.. (上级目录)</div>
          <div class="file-meta">
            <span>目录</span>
          </div>
        </div>
      </a>
    `;
  }

  // 生成文件项
  sortedFiles.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    const isDir = stats.isDirectory();
    const isFile = stats.isFile();

    // 构建 URL
    let fileUrl = currentUrl === "/" ? `/${file}` : `${currentUrl}${file}`;
    if (isDir && !fileUrl.endsWith("/")) {
      fileUrl += "/";
    }

    // 文件类型
    const ext = path.extname(file).toLowerCase().slice(1);

    // 格式化大小
    const size = formatSize(stats.size);
    const modified = stats.mtime.toLocaleString();

    const fileType = isDir ? "目录" : getFileType(ext);

    html += `
      <a href="${fileUrl}" class="file-item ${isDir ? "folder" : "file"}">
        <div class="file-icon">${isDir ? "📁" : "📄"}</div>
        <div class="file-info">
          <div class="file-name">${file}${isDir ? "/" : ""}</div>
          <div class="file-meta">
            <span class="file-type">${fileType}</span>
            ${!isDir ? `<span class="file-size">${size}</span>` : ""}
            <span class="file-modified">${modified}</span>
          </div>
        </div>
      </a>
    `;
  });

  return html;
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 获取文件类型描述
function getFileType(ext) {
  const types = {
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React",
    tsx: "React TS",
    html: "HTML",
    css: "CSS",
    scss: "SASS",
    less: "LESS",
    json: "JSON",
    md: "Markdown",
    txt: "文本",
    jpg: "图片",
    jpeg: "图片",
    png: "图片",
    gif: "图片",
    svg: "矢量图",
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    xls: "Excel",
    xlsx: "Excel",
    zip: "压缩包",
    rar: "压缩包",
    tar: "压缩包",
    gz: "压缩包",
  };
  return types[ext] || "文件";
}
