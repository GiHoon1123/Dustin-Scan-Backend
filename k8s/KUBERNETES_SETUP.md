# Kubernetes 설치 및 배포 가이드

## 1. K3s 설치 (서버에서 실행)

```bash
# SSH로 서버 접속
ssh user@your-server-ip

# K3s 설치 (한 줄!)
curl -sfL https://get.k3s.io | sh -

# 설치 확인
sudo k3s kubectl get nodes
```

## 2. kubeconfig 가져오기

### 서버에서 실행

```bash
# kubeconfig 출력
sudo cat /etc/rancher/k3s/k3s.yaml
```

### 로컬 Mac에서 실행

```bash
# 1. kubeconfig 디렉토리 생성
mkdir -p ~/.kube

# 2. 서버에서 복사한 내용을 파일로 저장
nano ~/.kube/config
# (위에서 복사한 내용 붙여넣기)

# 3. ⚠️ 중요: server 주소 수정
# server: https://127.0.0.1:6443
# ↓ 변경
# server: https://실제서버IP:6443

# 4. 권한 설정
chmod 600 ~/.kube/config

# 5. 연결 확인
kubectl get nodes
```

## 3. GitHub Secrets 설정

### KUBE_CONFIG 생성

```bash
# Mac에서 실행
cat ~/.kube/config | base64 | pbcopy
# (클립보드에 복사됨)
```

### GitHub에 등록

1. GitHub 리포지토리 → **Settings**
2. **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. Name: `KUBE_CONFIG`
5. Value: 복사한 base64 문자열 붙여넣기

## 4. 배포 테스트

### 로컬에서 수동 배포 (테스트용)

```bash
# Dustin-Scan-Backend 디렉토리에서
cd /Users/dustin/Desktop/common/Blockchain/Dustin/Dustin-Scan-Backend

# 1. Namespace 생성
kubectl create namespace dustin-scan

# 2. 배포
kubectl apply -k k8s/overlays/production

# 3. 상태 확인
kubectl get all -n dustin-scan

# 4. Pod 로그 확인
kubectl logs -n dustin-scan -l app=dustin-scan --all-containers=true -f
```

### GitHub Actions 자동 배포

```bash
# main 브랜치에 푸시
git add .
git commit -m "test: Kubernetes 배포 테스트"
git push origin main

# GitHub Actions 탭에서 배포 진행 상황 확인
```

## 5. API 서버 접속

### LoadBalancer 외부 IP 확인

```bash
kubectl get service api-service -n dustin-scan

# 출력 예시:
# NAME          TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE
# api-service   LoadBalancer   10.43.123.45    192.168.1.100   4000:30123/TCP   5m
```

### 접속

```bash
# API 호출
curl http://EXTERNAL-IP:4000/blocks

# Swagger 문서
open http://EXTERNAL-IP:4000/api
```

## 6. 트러블슈팅

### Pod이 Pending 상태인 경우

```bash
kubectl describe pod -n dustin-scan <pod-name>
```

### ImagePullBackOff 에러

```bash
# Docker Hub 이미지 이름 확인
kubectl get deployment -n dustin-scan -o yaml | grep image:
```

### 로그 확인

```bash
# Indexer 로그
kubectl logs -n dustin-scan -l component=indexer -f

# Sync 로그
kubectl logs -n dustin-scan -l component=sync -f

# API 로그
kubectl logs -n dustin-scan -l component=api -f
```

## 7. 삭제 (재배포 시)

```bash
# 모든 리소스 삭제
kubectl delete namespace dustin-scan

# 또는 개별 삭제
kubectl delete -k k8s/overlays/production
```

## 8. Dustin-Chain 연동

Kubernetes 내부에서 호스트 서버의 Dustin-Chain (localhost:3000)에 접속하려면:

### K3s의 경우

```yaml
# k8s/base/configmap.yaml에서
CHAIN_URL: 'http://호스트서버IP:3000'
```

또는 서버에서 방화벽 규칙 추가:

```bash
# 서버에서 실행
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## 요약

1. **서버에 K3s 설치** → `curl -sfL https://get.k3s.io | sh -`
2. **kubeconfig 복사** → `~/.kube/config`
3. **GitHub Secrets 등록** → `KUBE_CONFIG` (base64)
4. **수동 배포 테스트** → `kubectl apply -k k8s/overlays/production`
5. **자동 배포** → `git push origin main`
