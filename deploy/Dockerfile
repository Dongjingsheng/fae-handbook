# ============================================================
# Dockerfile — FAE手册 Vue 静态站点镜像
# 用 Nginx 提供静态资源，体积小、启动快
# ============================================================
FROM nginx:1.27-alpine

# 复制构建产物（构建在本地执行 npm run build 后，dist 已就绪）
COPY dist/ /usr/share/nginx/html/

# 覆盖 Nginx 配置（SPA 路由回退 + gzip 压缩）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1