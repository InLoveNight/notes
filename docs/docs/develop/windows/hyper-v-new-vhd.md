# 创建虚拟磁盘

在 PowerShell 中，创建一个 50G 的虚拟磁盘（VHDX）主要使用 **`New-VHD`** 命令。

根据使用场景不同，主要有两种常用的磁盘类型：

## 1. 创建 50G 动态扩展磁盘（推荐）

动态扩展磁盘（Dynamic）刚创建时只占用几百 KB 空间，随着写入数据才会逐渐变大，最高增长到 50G。

```powershell
New-VHD -Path "D:\Hyper-V\Disks\MyDisk.vhdx" -SizeBytes 50GB -Dynamic
```

## 2. 创建 50G 固定大小磁盘

固定大小磁盘（Fixed）在创建时会**立即占用 50GB 的实际物理存储空间**，读写性能比动态磁盘略好。

```powershell
New-VHD -Path "D:\Hyper-V\Disks\MyDisk.vhdx" -SizeBytes 50GB -Fixed
```

**参数说明**

-   **`-Path`**：虚拟磁盘的保存路径与文件名（必须以 `.vhdx` 或 `.vhd` 结尾，建议使用格式更新、性能更好的 `.vhdx`）。
-   **`-SizeBytes`**：磁盘容量大小，支持 `MB`、`GB`、`TB` 等单位。

## 附加到已有虚拟机：

磁盘创建完成后，可以使用以下命令将其挂载给指定的虚拟机：

```powershell
Add-VMHardDiskDrive -VMName "你的虚拟机名称" -Path "D:\Hyper-V\Disks\MyDisk.vhdx"
```