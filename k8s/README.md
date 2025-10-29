# Dustin Scan Backend - Kubernetes 배포 가이드

## 📋 사전 준비

### 1. Kubernetes 클러스터 준비

```bash
# kubectl 설치 확인
kubectl version --client

# 클러스터 연결 확인
kubectl cluster-info
```

### 2. Docker 이미지 빌드 & 푸시

```bash
# 1. Docker Hub 로그인
docker login

# 2. 이미지 빌드
docker build -t your-dockerhub-username/dustin-scan-api:latest .
docker build -t your-dockerhub-username/dustin-scan-indexer:latest .
docker build -t your-dockerhub-username/dustin-scan-sync:latest .

# 3. 이미지 푸시
docker push your-dockerhub-username/dustin-scan-api:latest
docker push your-dockerhub-username/dustin-scan-indexer:latest
docker push your-dockerhub-username/dustin-scan-sync:latest
```

### 3. YAML 파일 수정

**중요**: 각 Deployment 파일에서 이미지 이름을 **실제 Docker Hub 사용자명**으로 변경해야 합니다!

편집할 파일:

- `k8s/base/api-deployment.yaml`
- `k8s/base/indexer-deployment.yaml`
- `k8s/base/sync-deployment.yaml`

```yaml
# 변경 전
image: your-dockerhub-username/dustin-scan-api:latest

# 변경 후 (예시: Docker Hub 사용자명이 "dustin"인 경우)
image: dustin/dustin-scan-backend:latest
```

**참고**:

- 모노레포이므로 **이미지는 하나(`dustin-scan-backend`)** 입니다.
- API, Indexer, Sync는 **같은 이미지**를 사용하되, **command만 다르게** 설정됩니다.
- GitHub Actions가 자동으로 이미지를 업데이트하므로, 초기 설정만 올바르게 하면 됩니다.

---

## 🔄 GitHub Actions CI/CD

이 프로젝트는 GitHub Actions를 사용하여 자동 배포를 지원합니다.

### GitHub Secrets 설정

**리포지토리 Settings → Secrets and variables → Actions**에서 다음 Secrets를 추가하세요:

| Secret 이름       | 설명                      | 예시              |
| ----------------- | ------------------------- | ----------------- |
| `DOCKER_USERNAME` | Docker Hub 사용자명       | `dustin`          |
| `DOCKER_PASSWORD` | Docker Hub Access Token   | `dckr_pat_xxx...` |
| `KUBE_CONFIG`     | Kubernetes 설정 (base64)  | 아래 참조         |

#### KUBE_CONFIG 생성 방법

```bash
# 1. kubeconfig 파일을 base64로 인코딩
cat ~/.kube/config | base64

# 2. 출력된 문자열을 복사하여 GitHub Secrets에 등록
```

**참고**:

- macOS/Linux: `base64` 명령 사용
- Windows: `certutil -encode` 또는 온라인 base64 인코더 사용

### 자동 배포 프로세스

```
┌─────────────────────────────────────────────────────────┐
│  1. 코드 작성 & 커밋                                    │
│     └─ 로컬에서 개발                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. GitHub에 푸시                                       │
│     └─ main 브랜치 → 운영 환경 배포                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. GitHub Actions 자동 실행                            │
│     ├─ npm install                                      │
│     ├─ npm run build                                    │
│     ├─ Docker 이미지 빌드                              │
│     └─ Docker Hub에 푸시                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. Kubernetes 배포                                     │
│     ├─ kubectl apply -k (Kustomize)                     │
│     ├─ kubectl set image (이미지 업데이트)             │
│     └─ kubectl rollout status (배포 확인)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. 배포 완료! 🎉                                       │
│     └─ API, Indexer, Sync 모두 자동으로 재시작됨       │
└─────────────────────────────────────────────────────────┘
```

### Workflow 파일

- **`.github/workflows/deploy.yml`**: `main` 브랜치 → 자동 배포

### 배포 예시

```bash
# 코드 작성 후 main 브랜치에 푸시
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
# → GitHub Actions가 자동으로 배포
```

### 배포 상태 확인

GitHub 리포지토리 → **Actions** 탭에서 실시간 배포 진행 상황 확인 가능

---

## 🚀 배포 방법

```bash
# 1. 네임스페이스 생성
kubectl create namespace dustin-scan

# 2. Kustomize로 배포
kubectl apply -k k8s/overlays/production

# 3. 배포 확인
kubectl get pods -n dustin-scan
kubectl get services -n dustin-scan
kubectl get hpa -n dustin-scan
kubectl get all -n dustin-scan
```

---

## 📊 상태 확인

### Pods 상태 확인

```bash
kubectl get pods -n dustin-scan
kubectl describe pod <pod-name> -n dustin-scan
kubectl logs <pod-name> -n dustin-scan
kubectl logs <pod-name> -n dustin-scan -f  # 실시간 로그
```

### Service 확인

```bash
kubectl get services -n dustin-scan

# 외부 IP 확인 (LoadBalancer)
kubectl get service api-service -n dustin-scan
```

### HPA 확인

```bash
# HPA 상태 확인
kubectl get hpa -n dustin-scan

# HPA 자세히 보기
kubectl describe hpa api-hpa -n dustin-scan
```

---

## 🔧 디버깅

### Pod 내부 접속

```bash
kubectl exec -it <pod-name> -n dustin-scan -- /bin/sh
```

### 이벤트 확인

```bash
kubectl get events -n dustin-scan --sort-by='.lastTimestamp'
```

### 리소스 사용량 확인

```bash
kubectl top pods -n dustin-scan
kubectl top nodes
```

---

## 🔄 업데이트

### 이미지 업데이트

```bash
# 1. 새 이미지 빌드 & 푸시
docker build -t your-dockerhub-username/dustin-scan-api:v1.0.1 .
docker push your-dockerhub-username/dustin-scan-api:v1.0.1

# 2. Deployment 이미지 업데이트
kubectl set image deployment/api api=your-dockerhub-username/dustin-scan-api:v1.0.1 -n dustin-scan

# 3. 롤아웃 상태 확인
kubectl rollout status deployment/api -n dustin-scan

# 4. 롤아웃 히스토리
kubectl rollout history deployment/api -n dustin-scan

# 5. 롤백 (필요시)
kubectl rollout undo deployment/api -n dustin-scan
```

### ConfigMap/Secret 업데이트

```bash
# 변경 후 재배포
kubectl apply -k k8s/overlays/production

# Pod 재시작 (ConfigMap 변경사항 적용)
kubectl rollout restart deployment/prod-api -n dustin-scan
kubectl rollout restart deployment/prod-indexer -n dustin-scan
kubectl rollout restart deployment/prod-sync -n dustin-scan
```

---

## 🗑️ 삭제

### 배포 삭제

```bash
kubectl delete -k k8s/overlays/production
```

### 네임스페이스 전체 삭제 (모든 리소스 포함)

```bash
kubectl delete namespace dustin-scan
```

---

## 📦 구성 요소

| 컴포넌트 | Replicas | 스케일링      | 외부 접근         |
| -------- | -------- | ------------- | ----------------- |
| API      | 3 (초기) | ✅ HPA (2~10) | ✅ LoadBalancer   |
| Indexer  | 1 (고정) | ❌            | ❌ ClusterIP      |
| Sync     | 1 (고정) | ❌            | ❌ (Service 없음) |

### HPA 설정

- **Target**: API Deployment
- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU Threshold**: 70%

---

## 🔐 Secret 관리

### Secret 보기 (base64 디코딩)

```bash
kubectl get secret dustin-scan-secret -n dustin-scan -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### Secret 생성 (수동)

```bash
# 비밀번호를 base64로 인코딩
echo -n "1234" | base64  # MTIzNA==

# Secret 적용
kubectl apply -f k8s/base/secret.yaml
```

---

## 🌐 접속 방법

### API 서버 접속

```bash
# 외부 IP 확인
kubectl get service api-service -n dustin-scan

# 접속 (LoadBalancer EXTERNAL-IP 사용)
curl http://<EXTERNAL-IP>:4000/blocks

# Swagger 문서
http://<EXTERNAL-IP>:4000/api
```

### Port Forward (로컬 테스트용)

```bash
# API
kubectl port-forward service/api-service 4000:4000 -n dustin-scan

# Indexer
kubectl port-forward service/indexer-service 4001:4001 -n dustin-scan

# 접속
curl http://localhost:4000/blocks
```

---

## 📁 디렉토리 구조

```
k8s/
├── base/                     # 공통 설정
│   ├── namespace.yaml        # Namespace 정의
│   ├── configmap.yaml        # 일반 환경변수
│   ├── secret.yaml           # 민감 정보 (base64)
│   ├── api-deployment.yaml   # API Deployment
│   ├── indexer-deployment.yaml
│   ├── sync-deployment.yaml
│   ├── api-service.yaml      # API Service (LoadBalancer)
│   ├── indexer-service.yaml  # Indexer Service (ClusterIP)
│   ├── api-hpa.yaml          # API 오토스케일링
│   └── kustomization.yaml
│
└── overlays/                 # 환경별 설정
    └── production/           # 운영 환경
        ├── kustomization.yaml
        └── configmap-patch.yaml
```

---

## 🐛 자주 발생하는 문제

### 1. ImagePullBackOff

```bash
# 원인: Docker 이미지를 Pull할 수 없음
# 해결: 이미지 이름 확인, Docker Hub에 이미지가 있는지 확인

kubectl describe pod <pod-name> -n dustin-scan
```

### 2. CrashLoopBackOff

```bash
# 원인: 애플리케이션 시작 실패
# 해결: 로그 확인

kubectl logs <pod-name> -n dustin-scan
```

### 3. Pending 상태

```bash
# 원인: 리소스 부족 또는 스케줄링 불가
# 해결: 노드 리소스 확인

kubectl describe pod <pod-name> -n dustin-scan
kubectl top nodes
```

---

## 📝 참고사항

1. **데이터베이스**: PostgreSQL은 별도로 구성해야 합니다 (StatefulSet 또는 외부 DB)
2. **이미지 태그**: `:latest` 대신 버전 태그 사용 권장 (예: `:v1.0.0`)
3. **리소스 제한**: 운영 환경에서는 리소스 설정을 모니터링 후 조정
4. **백업**: Secret과 ConfigMap은 별도 백업 필요
