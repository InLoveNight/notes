# PVE LXC 容器完全指南

**适用场景：** 在 PVE 上部署轻量级 Linux 容器，兼顾性能与资源效率。
**核心概念：** LXC 是**系统级容器**，提供完整 OS 环境；Docker 是**应用级容器**，两者可共存互补。



## 1. LXC 基础知识速览

### 1.1 LXC vs 虚拟机

LXC 共享宿主机内核，资源占用低、启动速度快，但安全性较虚拟机略低。适合运行文件服务器、数据库等多应用服务场景。

### 1.2 特权容器 vs 无特权容器（关键抉择）

| 类型                   | 级别                               | 安全 | 资源                      | 场景  |
| :-- | :-- | :-- | :-- | :-- |
| **无特权容器**（推荐） | 容器内 root 被映射为普通用户，权限受限 | 高     | 受限，不支持 NFS/SMB 直接挂载 | 常规服务（DNS、数据库等） |
| **特权容器**           | 容器内 root = 宿主机 root              | 低     | 支持硬件直通、NFS/SMB 挂载    | 需 GPU 转码、挂载共享存储 |

**建议：** 初学者优先选择**无特权容器**保障宿主机安全。



## 2. 下载容器模板

- **Web 界面方式：** 数据中心 → 你的 PVE 节点 → local 存储 → CT模板 → 选择模板下载（如 Debian、Ubuntu）
- **命令行方式：**

```bash
pveam download local debian-12-standard_12.0-1_amd64.tar.zst
```

## 3. 创建容器

### 3.1 Web 界面创建（推荐新手）

点击「Create CT」，按步骤配置：

1. **常规：** 设置 CT ID（如 102）、主机名、密码
2. **模板：** 选择已下载的模板
3. **磁盘：** 默认 8GB，建议根据需求调整（运行 Docker 建议 20-50GB）
4. **CPU/内存：** 按需分配
5. **网络：** 桥接选择 `vmbr0`，配置静态 IP 或 DHCP

### 3.2 命令行创建（特权模式示例）

```bash
pct create 102 local:vztmpl/debian-12-standard_12.0-1_amd64.tar.zst \
  --rootfs local-lvm:20 \
  --memory 2048 \
  --cores 2 \
  --hostname my-lxc \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 0   # 0=特权容器，1=无特权容器
```

### 3.3 基本管理命令

```bash
pct start <CTID>     # 启动
pct stop <CTID>      # 停止
pct enter <CTID>     # 进入容器 Shell
pct status <CTID>    # 查看状态
```



## 4. 映射宿主机目录（Bind Mounts）

这是 LXC 最常用的功能之一，但**特权容器与无特权容器处理方式不同**。

>    [!TIP] 提示
>
>   如果需要映射多个目录，则 `-mp0` 往上增加即可：`-mp1` `-mp2` ...

### 4.1 方法一：通过 pct set 命令（推荐）

```bash
pct set <CTID> -mp0 /宿主机/路径,mp=/容器内/挂载点
```

示例：将宿主机 `/mnt/pve/data` 映射到容器 `/data`

```bash
pct set 102 -mp0 /mnt/pve/data,mp=/data
```

### 4.2 方法二：直接编辑配置文件

```bash
nano /etc/pve/lxc/<CTID>.conf
```

添加一行：

```text
mp0: /mnt/pve/data,mp=/data
```

## 5. 配置检查与生效

### 5.1 重启容器使配置生效

```bash
pct stop <CTID> && pct start <CTID>
```

### 5.2 验证挂载是否成功

进入容器检查：

```bash
pct enter <CTID>
df -h | grep /data   # 确认挂载点存在
ls -la /data         # 检查文件权限
```

### 5.3 查看容器完整配置

```bash
cat /etc/pve/lxc/<CTID>.conf
```



## 6. 导出容器

要在 Proxmox VE (PVE) 中将自己配置好的 LXC 容器打包成自定义 CT 模板，并支持在 PVE Web 界面（`local` -> `CT 模板`）直接上传使用，最简单标准的方法是**先停止容器，再导出为 `.tar.zst` (或 `.tar.gz`) 压缩包**。



### 6.1 第一步：清理容器（可选，但强烈建议）

在打包之前，建议清理容器内的临时文件和历史记录，以减小模板体积并保证安全性：

1. 登录到你想要打包的 LXC 容器内部。
2. 清理软件包缓存和日志：

``` bash
# Debian / Ubuntu
apt-get clean
rm -rf /var/lib/apt/lists/*

# CentOS / Rocky Linux / AlmaLinux
dnf clean all

# 清理日志与命令历史
rm -rf /var/log/*
history -c
```

3. 关机容器：在 PVE 界面或容器内执行 `poweroff`。



### 6.2 在 PVE 宿主机上打包容器

在 PVE 的 **Shell（终端）** 中执行打包命令。假设你的容器 ID 是 **`100`**，你想生成的模板名称为 **`my-custom-template.tar.zst`**：

1.  **进入备份/临时目录**（确保有足够的磁盘空间）：

```bash
cd /var/lib/vz/template/cache
```

> [!NOTE] 小技巧   
> 直接在 `/var/lib/vz/template/cache` 目录下打包，PVE 网页端会**自动识别**该模板，你甚至都不用手动上传！

2.  **执行打包命令**： 使用 PVE 自带的 `vzdump` 命令，以 `stop` 模式打包，格式指定为 `zstd`（压缩比高且速度快）：

```bash
vzdump 100 --compress zstd --dumpdir /var/lib/vz/template/cache --mode stop
```

*说明：这会在该目录下生成一个类似于 `vzdump-openvz-100-2026_07_31-xx_xx_xx.tar.zst` 的文件。*



### 6.3 重命名并符合上传/使用规范

PVE 对模板文件的命名有一定规范，虽然默认导出的 `vzdump-openvz-...` 文件可以直接用来创建容器，但如果你想把它当成标准的 CT 模板（甚至分享给别人从 Web 界面上传），建议重命名：

```bash
# 重命名为一个清晰的名字（保持 .tar.zst 或 .tar.gz 后缀）
mv vzdump-openvz-100-*.tar.zst ubuntu-22.04-custom-v1.tar.zst
```



## 总结速查表

| 操作场景               | 关键命令/路径                                       |
| :-- | :-- |
| **更换模板源**         | 修改 `/usr/share/perl5/PVE/APLInfo.pm`              |
| **下载模板**           | `pveam download local <模板名>`                     |
| **创建容器（命令行）** | `pct create <CTID> ... --unprivileged 0/1`          |
| **基本管理**           | `pct start/stop/enter <CTID>`                       |
| **映射宿主机目录**     | `pct set <CTID> -mp0 /host/path,mp=/container/path` |
| **配置文件位置**       | `/etc/pve/lxc/<CTID>.conf`                          |
| **启用 Docker 支持**   | `features: nesting=1,keyctl=1`                      |

