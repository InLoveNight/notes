# 网络发现



自 Windows 10/11 起，微软禁用了传统的 NetBIOS 协议，改用 **WS-Discovery (WSD)** 协议来实现网络设备发现。







要在 Windows 的文件资源管理器“网络”一栏中自动显示你的 Linux 电脑，Linux 需要运行 **WSDD (Web Services Dynamic Discovery)** 服务。



## 1. 安装 wsdd

``` bash
apt install wsdd
```



## 2. 启动并设置开机自启

``` bash
sudo systemctl enable --now wsdd
```

>   [!CAUTION]  注意
>
>   如果有防火墙
>
>   ``` bash
>   ufw allow 3702/udp
>   ```

## 3. 注意，如果没有启动项

`Failed to enable unit: Unit file wsdd.service does not exist.`

### 3.1 确认 `wsdd` 可执行文件路径

``` bash
which wsdd
```



### 3.2 手动创建 systemd 服务文件

使用编辑器创建 `/etc/systemd/system/wsdd.service` 文件：

``` bash
vim /etc/systemd/system/wsdd.service
```

将以下配置粘贴：

``` toml
[Unit]
Description=Web Services Dynamic Discovery host daemon
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/wsdd		# 对应 3.1 的路径 
Restart=on-failure

[Install]
WantedBy=multi-user.target
```



### 3.3 重载并启动服务

1.   重新加载 systemd 配置：

```bash
systemctl daemon-reload
```

2.   设置开机自启并立即启动：

```bash
systemctl enable --now wsdd
```

3.   检查运行状态：

```bash
systemctl status wsdd
```



## 4. 删除启动项

如果以后卸载或删除了 `wsdd`，需要按照以下步骤停止服务并彻底清理手动创建的 `systemd` 启动项

### 4.1 停止服务并取消开机自启

在删除文件前，先让服务停止运行：

```bash
systemctl stop wsdd
systemctl disable wsdd
```

### 4.2 删除手动创建的服务配置文件

删除之前在系统中创建的 `.service` 文件：

```bash
rm /etc/systemd/system/wsdd.service
```

### 4.3 重新加载 systemd 配置

让系统重新读取服务列表，释放已删除的服务占用：

```bash
systemctl daemon-reload
```

### 4.4 重置失效的服务状态（可选）

清理系统中可能残余的失败或无效状态记录：

```bash
systemctl reset-failed
```

### 4.5 验证清理结果

可以运行以下命令检查服务是否已被彻底移除：

```bash
systemctl status wsdd
```

>   **预期输出**：`Unit wsdd.service could not be found.`（表示系统已完全找不到该服务，清理完成）。

