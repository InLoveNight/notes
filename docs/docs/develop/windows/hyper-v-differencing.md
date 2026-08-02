# Hyper-V 差分磁盘



在 PowerShell 中，创建 Hyper-V 差分磁盘（Differencing Disk）核心命令是 **`New-VHD`**，并指定 **`-Differencing`** 参数和 **`-ParentPath`**（父磁盘路径）。

## 1. 创建差分磁盘

在创建前，需准备好一个作为模板的母盘（父磁盘，如 `Parent.vhdx`）。

```powershell
New-VHD -Path "D:\Hyper-V\Disks\ChildDisk1.vhdx" -ParentPath "D:\Hyper-V\Master\Parent.vhdx" -Differencing
```

-   **`-Path`**：新创建的差分磁盘（子磁盘）保存路径。
-   **`-ParentPath`**：基础磁盘（父磁盘）的路径。
-   **`-Differencing`**：指定磁盘类型为差分磁盘。

## 2. 使用方式与常见场景

### 场景 A：创建全新虚拟机并直接挂载差分磁盘

```powershell
New-VM -Name "VM-Test01" -MemoryStartupBytes 2GB -Generation 2 -VHDPath "D:\Hyper-V\Disks\ChildDisk1.vhdx"
```

### 场景 B：将差分磁盘挂载到已有的虚拟机

```powershell
Add-VMHardDiskDrive -VMName "VM-Test01" -Path "D:\Hyper-V\Disks\ChildDisk1.vhdx"
```

## 3. 查看与管理差分磁盘

**检查差分磁盘的信息及其父盘路径：**

``` powershell
Get-VHD -Path "D:\Hyper-V\Disks\ChildDisk1.vhdx"
```

输出中的 `ParentPath` 属性会显示其依赖的母盘。

**合并差分磁盘（将修改写回父盘或合并为新盘）：**

``` powershell
# 将差分磁盘的数据直接合并回父磁盘（注意：会改变父磁盘数据）
Merge-VHD -Path "D:\Hyper-V\Disks\ChildDisk1.vhdx"
```

## 注意事项与最佳实践

- **切勿直接修改父磁盘**：一旦差分磁盘开始使用，**绝对不能启动或修改父磁盘**，否则所有依赖该父磁盘的差分磁盘都会损坏崩溃。
- **建议将父磁盘设为只读**：为防止误操作，可以在文件系统中将母盘文件设置为“只读”属性：

```powershell
Set-ItemProperty -Path "D:\Hyper-V\Master\Parent.vhdx" -Name IsReadOnly -Value $true
```