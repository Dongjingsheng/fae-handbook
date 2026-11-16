#!/bin/bash
# ============================================================
# deploy.sh — FAE手册一键部署到 K8s
# 用法:
#   1. 先修改本文件底部的 REGISTRY（你的镜像仓库地址）
#   2. ./deploy.sh build push
#   3. ./deploy.sh deploy
# ============================================================
set -e

# ---------- 配置（按需修改） ----------
REGISTRY="registry.example.com/fae"   # 你的镜像仓库
TAG="v$(date +%Y%m%d%H%M)"            # 每次构建自动打时间戳标签
NAMESPACE="fae"
DOMAIN="faebook.example.com"          # 你的域名
# -------------------------------------

cd "$(dirname "$0")/.."

# 1. 构建前端产物
echo "==> [1/5] 构建 Vue 项目"
npm run build

# 2. 构建镜像
echo "==> [2/5] 构建 Docker 镜像: $REGISTRY/fae-handbook:$TAG"
docker build -f deploy/Dockerfile -t "$REGISTRY/fae-handbook:$TAG" .
docker tag "$REGISTRY/fae-handbook:$TAG" "$REGISTRY/fae-handbook:latest"

# 3. 推送镜像（如果指定了 push）
if [[ "$1" == "push" || "$2" == "push" ]]; then
  echo "==> [3/5] 推送镜像到仓库"
  docker push "$REGISTRY/fae-handbook:$TAG"
  docker push "$REGISTRY/fae-handbook:latest"
else
  echo "==> [3/5] 跳过推送（未指定 push）；如需推送执行: ./deploy.sh push"
fi

# 4. 部署
echo "==> [4/5] 部署到 K8s"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
sed -e "s|<REGISTRY>/fae-handbook:<TAG>|$REGISTRY/fae-handbook:$TAG|g" \
    -e "s|faebook.example.com|$DOMAIN|g" \
    deploy/deployment.yaml | kubectl apply -f -
kubectl apply -f deploy/service.yaml
sed "s|faebook.example.com|$DOMAIN|g" deploy/ingress.yaml | kubectl apply -f -

# 5. 等待就绪
echo "==> [5/5] 等待 Pod 就绪"
kubectl -n "$NAMESPACE" rollout status deployment/fae-handbook --timeout=120s
kubectl -n "$NAMESPACE" get pods,svc,ingress

echo ""
echo "✅ 部署完成！访问地址: http://$DOMAIN/"
echo "   本次版本标签: $TAG"