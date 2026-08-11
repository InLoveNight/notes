# Systemctl 教程

> systemctl 是 Linux 下管理 systemd 服务和服务器的命令工具，用来控制开机自启、启动、停止、重启、查看状态等。

## 1. 基础概念

systemd 是 Linux 的系统和服务管理器，PID 为 1。它的核心概念是 **Unit**（单元），每个 unit 对应一个 `.service` 文件（或其他类型）。

**Unit 文件的存放路径（优先级从高到低）：**

| 路径                       | 说明                               |
| :------------------------- | :--------------------------------- |
| `/etc/systemd/system/`     | **用户自定义的服务**（推荐放这里） |
| `/usr/lib/systemd/system/` | 软件包安装时自带的服务             |
| `/run/systemd/system/`     | 运行时临时生成的服务               |

## 2. 常用命令速查

### 服务管理

```bash
systemctl start   my-service    # 启动服务
systemctl stop    my-service    # 停止服务
systemctl restart my-service    # 重启服务
systemctl reload  my-service    # 重新加载配置（不中断服务）
systemctl status  my-service    # 查看状态（运行、日志、PID）
```

### 开机自启

```bash
systemctl enable  my-service    # 启用开机自启
systemctl disable my-service    # 禁用开机自启
systemctl is-enabled my-service # 查看是否已启用
```

### 查看

```bash
systemctl list-units --type=service          # 列出所有正在运行的服务
systemctl list-unit-files --type=service     # 列出所有已安装的服务文件
systemctl list-dependencies my-service       # 查看依赖关系
systemctl show my-service                    # 查看服务的完整配置
```

### 日志查看

```bash
journalctl -u my-service           # 查看该服务的全部日志
journalctl -u my-service -f        # 实时跟踪日志（类似 tail -f）
journalctl -u my-service --no-pager # 不分页输出（适合看全部）
journalctl -u my-service -n 50     # 只看最后 50 行
```

## 3. Unit 文件的结构

一个典型的 `.service` 文件长这样：

```ini
[Unit]
Description=我的服务描述
After=network.target           # 在网络就绪后再启动
Wants=network-online.target    # 建议依赖（非强依赖）

[Service]
Type=simple                    # 类型：simple/forking/oneshot
User=root                      # 以哪个用户运行
WorkingDirectory=/root/myapp   # 工作目录
ExecStart=/usr/bin/bun run index.ts  # 执行的命令
Restart=on-failure             # 失败时自动重启
RestartSec=5                   # 重启间隔 5 秒
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target     # 在多用户模式下启用（即开机自启）
```

### 关键字段说明

| 字段                 | 说明                                 |
| :------------------- | :----------------------------------- |
| `Type=simple`        | 默认值，主进程直接在前台运行         |
| `Type=forking`       | 进程会 fork 到后台（如 nginx、sshd） |
| `Type=oneshot`       | 一次性任务，执行完就退出             |
| `ExecStart`          | **启动命令（必填）**                 |
| `ExecStop`           | 停止命令（可选）                     |
| `ExecReload`         | 重载命令（可选）                     |
| `Restart=always`     | 总是重启                             |
| `Restart=on-failure` | 仅失败时重启                         |
| `Restart=no`         | 不自动重启（默认）                   |
| `RestartSec`         | 重启等待秒数                         |
| `User` / `Group`     | 指定运行用户                         |
| `WorkingDirectory`   | 工作目录                             |
| `Environment`        | 环境变量                             |
| `After`              | 在哪些服务之后启动                   |
| `Requires`           | 强依赖（依赖失败则本服务也不启动）   |
| `Wants`              | 建议依赖（依赖失败不影响本服务）     |

## 4. 实战：用 bun 运行 TypeScript 实现开机自启

### 场景

写一个 TypeScript 脚本，用 bun 运行，开机自启，崩溃后自动重启。

### 第一步：准备 TypeScript 脚本

假设我们在 `/root/bot/index.ts`：

```typescript
// /root/bot/index.ts
const handler = () => {
  console.log(`[Bot] 运行中... PID: ${process.pid}`);
};

console.log("[Bot] 服务已启动");
handler();

// 保持进程不退出
setInterval(handler, 60000);
```

确认 bun 能运行它：

```bash
cd /root/bot
bun run index.ts
```

按 `Ctrl+C` 停止测试。

### 第二步：创建 systemd 服务文件

```bash
sudo vim /etc/systemd/system/bot.service
```

写入：

```ini
[Unit]
Description=我的 Bot 服务
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/bot
ExecStart=/usr/bin/bun run index.ts
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

> 如果你不确定 bun 的路径，用 `which bun` 查看

### 第三步：重载并启动

```bash
# 1. 通知 systemd 重新读取配置文件
systemctl daemon-reload

# 2. 启动服务
systemctl start bot

# 3. 查看状态
systemctl status bot

# 4. 启用开机自启
systemctl enable bot
```

### 第四步：验证

```bash
# 查看运行状态
systemctl status bot

# 查看实时日志
journalctl -u bot -f

# 重启服务测试
systemctl restart bot

# 测试开机自启（重启后验证）
# reboot
# 重启后执行：
systemctl status bot
```

## 5. 如何删除服务

### 方法一：完整删除

```bash
# 1. 停止服务
systemctl stop bot

# 2. 禁用开机自启
systemctl disable bot

# 3. 删除服务文件
rm /etc/systemd/system/bot.service

# 4. 重载 systemd
systemctl daemon-reload

# 5. 重置失败状态（可选）
systemctl reset-failed bot
```

### 方法二：只禁用，保留文件

```bash
systemctl stop bot
systemctl disable bot
# 以后想用可以随时 systemctl enable bot 重新启用
```

### 验证已删除

```bash
systemctl status bot
# 应该显示：Unit bot.service could not be found.
```

## 6. 排错技巧

### 服务启动失败

```bash
# 看详细日志
journalctl -u bot -n 50 --no-pager

# 常见原因：
#   - ExecStart 路径写错了 → 用 which 确认路径
#   - 权限不足 → 检查 User 和文件权限
#   - 工作目录不存在 → 确认 WorkingDirectory 路径
```

### 修改服务文件后

```bash
systemctl daemon-reload    # 必须执行，否则 systemd 不认新配置
systemctl restart bot      # 重启使新配置生效
```

### 查看完整错误

```bash
systemctl status bot -l    # -l 显示完整输出，不截断
```

### 常用调试命令

```bash
# 测试 ExecStart 命令是否能直接运行
/usr/bin/bun run /root/bot/index.ts

# 检查服务依赖是否就绪
systemctl list-dependencies bot

# 查看服务详细配置（确认路径正确）
systemctl show bot | grep -E "ExecStart|WorkingDirectory|User"
```

## 附录：快速创建服务的模板

```bash
# 一键创建服务文件
cat > /etc/systemd/system/myapp.service << 'EOF'
[Unit]
Description=My App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/myapp
ExecStart=/usr/bin/bun run index.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动
systemctl daemon-reload
systemctl enable --now myapp
```

> `enable --now` = `enable` + `start` 一步到位