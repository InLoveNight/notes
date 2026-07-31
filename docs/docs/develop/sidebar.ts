import type { DefaultTheme } from "vitepress";


export default [
    {
        text: '开发层级',
        items: [
            { text: 'Bun Workers', link: 'docs/develop/develop/bun-worker' },
            { text: 'P-Queue 队列', link: 'docs/develop/develop/p-queue' },
            { text: 'OpenAi', link: 'docs/develop/develop/openai' },
            { text: 'Vercel Ai SDK', link: 'docs/develop/develop/vercel-ai-sdk' },
        ],
        collapsed: false
    },
    {
        text: '系统层级',
        collapsed: false,
        items: [
            { text: 'Linux 磁盘管理', link: 'docs/develop/system/linux-storage' },
            { text: 'Linux Samba', link: 'docs/develop/system/linux-samba' },
            { text: 'Linux 网络发现', link: 'docs/develop/system/linux-wsdd' },
        ]
    },
    {
        text: 'PVE',
        collapsed: false,
        items: [
            { text: 'PVE LXC', link: 'docs/develop/pve/pve-lxc' },
            { text: 'Linux Openwrt', link: 'docs/develop/pve/pve-openwrt' },
        ]
    }

] satisfies DefaultTheme.SidebarItem[]