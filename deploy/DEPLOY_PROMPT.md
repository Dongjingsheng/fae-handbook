# 📋 部署任务 Prompt（给 NAS/云端 Agent 的完整指令）

> 你是本次部署的执行 Agent。请严格按照下面的步骤完成「内存FAE成长手册」的部署。
> 遇到任何偏差，先停下来查看本文件，按"故障排查"节处理；处理不了再向用户确认。

---

## 一、任务概要

把 Vue 构建产物（纯静态站点）部署为可访问的 Web 服务。

- **项目**：内存FAE助理工程师 · 成长手册（Vue3 静态站）
- **产物位置**：`<解压目录>/dist/`（index.html + assets/，约 286KB）
- **部署方式**：优先 K8s；若环境无 K8s 则用 Docker Compose（备选方案已备好）

## 二、解压位置

用户上传的文件包为 `fae-handbook-deploy.zip`，解压后目录结构：

```
fae-handbook/
├── dist/                  ← 前端构建产物（直接可服务）
├── deploy/
│   ├── Dockerfile         ← Nginx 镜像
│   ├── nginx.conf         ← 静态服务 + gzip + SPA 回退
│   ├── deployment.yaml    ← K8s Deployment
│   ├── service.yaml       ← K8s Service
│   ├── ingress.yaml       ← K8s Ingress
│   ├── docker-compose.yml ← NAS/Docker 备选方案
│   └── README.md          ← 部署说明
├── 源码/                  ← Vue 源码（如需改版再构建）
│   ├── src/
│   ├── package.json
│   └── ...
└── DEPLOY_PROMPT.md       ← 本文件
```

## 三、部署流程

### 第 1 步：环境探测（先看有什么再决定怎么做）

```bash
# 检查容器/编排工具
which kubectl docker docker-compose 2>/dev/null
kubectl version --client 2>/dev/null | head -5
docker version --format '{{.Server.Version}}' 2>/dev/null
```

**判断：**
- 有 `kubectl` 且能连集群（`kubectl cluster-info` 成功）→ 走 **K8s 部署**
- 只有 docker / docker-compose → 走 **Docker Compose 部署**
- 两个都没有 → 报告用户环境不满足，不要瞎装

### 第 2 步A：K8s 部署（有集群时）

```bash
cd <解压目录>
# 1. 构建镜像（镜像名按需改：<registry>/fae-handbook:<tag>）
docker build -f deploy/Dockerfile -t fae-handbook:latest .

# 2. 建命名空间并应用清单（deployment.yaml 中的 image 要改成你实际镜像名）
kubectl create namespace fae
sed 's|<REGISTRY>/fae-handbook:<TAG>|fae-handbook:latest|g' deploy/deployment.yaml | kubectl apply -f -
kubectl apply -f deploy/service.yaml

# 3. 检查
kubectl -n fae rollout status deployment/fae-handbook --timeout=120s
kubectl -n fae get pods,svc

# 4. Ingress（可选，需要域名；没有就先用 Service 的 nodePort/port-forward 验证）
# 有域名的话：修改 ingress.yaml 的 host 后 apply；没有就跳过，向用户说明如何访问。
```

### 第 2步B：Docker Compose 部署（NAS 常见）

```bash
cd <解压目录>/deploy
docker compose up -d
# 访问 http://<NAS-IP>:8080
```

### 第 3 步：验证（必须做）

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:80/       # K8s: 用 port-forward 或 ingress
curl -s http://localhost:8080/ | head -c 200                      # Compose: 直接
# 期望:
#   - HTTP 200
#   - HTML 内容包含 "内存FAE助理工程师"
#   - 能加载到 assets 下的 js/css（curl -sI http://.../assets/xxx.js 返回 200）
```

验证通过才算部署成功。失败则进入故障排查。

## 四、必须告诉用户的信息（部署完成后输出）

```
✅ 部署完成
- 访问地址: http://<IP或域名>/     （K8s: ingress地址 / nodePort；Compose: NAS-IP:8080）
- 部署方式: K8s / Docker Compose
- 容器/副本数: ...
- 如何更新: (下次拿到新 dist 后重复构建+发布)
- 数据说明: 进度/笔记存在浏览器 localStorage，换设备不共享；服务器无需持久卷
```

## 五、故障排查

| 症状 | 处理 |
|---|---|
| 镜像构建失败 | 检查网络/换镜像源；确认 dist 存在 |
| Pod 一直 CrashLoopBackOff | `kubectl -n fae logs deployment/fae-handbook` 看 nginx 报错 |
| curl 404 | 确认 nginx.conf 的 root 路径与 dist 放置一致 |
| 端口占用 | Compose 改宿主端口（8080→8081） |
| 无法访问 | 检查防火墙/安全组放行端口；K8s 检查 service selector 是否匹配 pod label (`app: fae-handbook`) |

## 六、安全与边界（重要）

1. **只做部署，不要改源码**（除非用户明确要求）
2. **不要上传/分享任何用户的私有数据**
3. 需要新增凭据/推送镜像到远程仓库时，**先问用户**
4. 如果这一步需要互联网下载依赖，先确认网络可用
5. 不要创建收费的云资源（这是本地 NAS/已有集群，用现成环境即可）

---

*生成时间：2026-11-16。若部署环境与我描述不符，请把实际情况反馈给用户。*