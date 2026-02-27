### 1) Clone project

```bash
git clone https://github.com/nguyentienthuc2004/MAD_BACKEND.git
```

### 2) Cài dependencies

```bash
npm install
```

### 3) Tạo file `.env`

Tạo file `.env` ngay trong thư mục `backend/` với nội dung tối thiểu:

```env
PORT=3000

# MongoDB connection string
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<db_name>?retryWrites=true&w=majority
```
### 4) Chạy project

Chạy chế độ dev (tự reload bằng nodemon):

```bash
npm run dev
```
Mặc định server chạy:

- API root: http://localhost:3000/
- Swagger: http://localhost:3000/api-docs

---

## Chạy bằng Docker Compose (tuỳ chọn)

> Cần cài Docker Desktop trước.

Tạo `.env` như bước trên, sau đó chạy:

```bash
docker compose up --build
```

---
