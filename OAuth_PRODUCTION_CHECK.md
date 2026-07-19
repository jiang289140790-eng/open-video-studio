# OAuth 生产配置检查

检查范围：Supabase Auth、Google OAuth、X OAuth 2.0、Discord OAuth。

本次检查只读取项目配置和生产地址，没有修改前端登录代码，也没有修改 `apps/web/auth-service.js`。

## 1. 当前项目配置

| 项目 | 当前值/状态 |
|---|---|
| Supabase 项目 | `open-video-studio` |
| Supabase Project Ref | `wyvswkxogkmywduhrhkw` |
| Supabase 项目状态 | `ACTIVE_HEALTHY` |
| 前端生产地址 | `https://jiang289140790-eng.github.io/open-video-studio/` |
| 登录后默认地址 | `https://jiang289140790-eng.github.io/open-video-studio/app.html` |
| 本地开发地址 | `http://localhost:5173/` |
| Supabase Auth 回调地址 | `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback` |

代码中的生产地址来自 `apps/web/supabase-client.js`，当前没有发现生产 `.env` 文件被提交到仓库。密钥值未读取、未输出。

## 2. Supabase Auth URL 配置

Supabase Dashboard 位置：

`Authentication → URL Configuration`

建议确认以下配置：

### Site URL

```text
https://jiang289140790-eng.github.io/open-video-studio/
```

### Redirect URLs

至少加入以下地址：

```text
https://jiang289140790-eng.github.io/open-video-studio/**
https://jiang289140790-eng.github.io/open-video-studio/app.html
https://jiang289140790-eng.github.io/open-video-studio/signin.html
https://jiang289140790-eng.github.io/open-video-studio/zh/login/
```

本地测试时另外加入：

```text
http://localhost:5173/**
http://127.0.0.1:5173/**
http://localhost:4173/**
http://127.0.0.1:4173/**
```

注意：OAuth 服务商后台填写的是 Supabase Auth 回调地址，不是 GitHub Pages 地址；GitHub Pages 地址填写在 Supabase 的 Redirect URLs 中。

## 3. Google OAuth

### Google Cloud Console 位置

`APIs & Services → Credentials → OAuth 2.0 Client IDs → Web application`

### 必须确认

Authorized redirect URI 必须精确为：

```text
https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback
```

Authorized JavaScript origins 可加入：

```text
https://jiang289140790-eng.github.io
```

### 当前错误原因

`redirect_uri_mismatch` 表示 Google 收到的 redirect URI 没有与该 OAuth Client 的 Authorized redirect URIs 完全匹配。

常见原因：

1. 填成了 GitHub Pages 地址，而不是 Supabase callback。
2. 使用了另一个 Supabase 项目的 callback。
3. URL 少了 `/auth/v1/callback`。
4. 使用了错误的 OAuth Client 类型或旧 Client ID。
5. 修改后尚未等待 Google 配置生效。

### Supabase Dashboard 位置

`Authentication → Sign In / Providers → Google`

确认 Google Enabled、Client ID、Client Secret 属于同一个 Google Web OAuth Client。

## 4. X OAuth 2.0

### X Developer Portal 位置

`developer.x.com → Projects & Apps → App → User authentication settings`

### 必须确认

Callback URL / Redirect URL：

```text
https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback
```

Website URL：

```text
https://jiang289140790-eng.github.io/open-video-studio/
```

开启：

- OAuth 2.0
- User authentication settings
- Web App 类型

建议使用 OAuth 2.0 Authorization Code with PKCE，回调地址只能填写 Supabase callback，不能填写前端页面地址。

### 权限范围

X OAuth 2.0 至少要能完成登录所需的用户身份读取。若 X 控制台要求 scopes，按 Supabase X/Twitter OAuth 2.0 配置页面显示的范围保存，不要继续扩大到发帖、私信等权限。

### 当前错误原因

“无法获得应用访问权限”通常不是前端代码错误，优先检查：

1. X App 仍处于受限/未完成 User authentication 配置状态。
2. OAuth 2.0 没有开启，或误用了 OAuth 1.0a 配置。
3. Callback URL 与 Supabase callback 不完全一致。
4. Client ID/Secret 与 Supabase 中保存的不是同一个 X App。
5. 应用访问权限、测试用户或项目状态限制了当前账号。

## 5. Discord OAuth

### Discord Developer Portal 位置

`Discord Developer Portal → Application → OAuth2 → Redirects`

Redirect URL：

```text
https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback
```

### Supabase Dashboard 位置

`Authentication → Sign In / Providers → Discord`

确认 Discord Enabled、Client ID、Client Secret 来自同一个 Discord Application。

## 6. 配置结论

| 项目 | 结论 |
|---|---|
| 前端生产 redirectTo | 已固定为 GitHub Pages 生产地址下的页面 |
| Supabase Project Ref | 已确认 |
| Supabase migration / functions | 已线上部署 |
| Google 400 错误 | 优先修正 Google Authorized redirect URI |
| X 无访问权限 | 优先检查 OAuth 2.0、应用状态和 Callback URL |
| Discord | 需要在 Supabase 和 Discord 双方确认 callback 与凭据 |
| 前端代码 | 本次未修改 |
| `auth-service.js` | 本次未修改 |

## 7. 修复顺序

1. 在 Supabase URL Configuration 保存 Site URL 和 Redirect URLs。
2. 在 Google Cloud Console 修正 Authorized redirect URI。
3. 在 X Developer Portal 重新保存 OAuth 2.0 User authentication 配置。
4. 在 Supabase Providers 页面重新核对 Google、X、Discord 的 Client ID/Secret。
5. 使用生产站点分别测试 Google、X、Discord。
6. 如果仍失败，只记录 OAuth provider 返回的错误码，不要把 Client Secret 或授权 URL 中的敏感参数发到聊天窗口。

## 官方参考

- [Supabase Social Login](https://supabase.com/docs/guides/auth/social-login)
- [Supabase Google Login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase X/Twitter Login](https://supabase.com/docs/guides/auth/social-login/auth-twitter)
- [Supabase Discord Login](https://supabase.com/docs/guides/auth/social-login/auth-discord)
