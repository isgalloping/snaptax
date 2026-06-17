重构版 Settings 页面视觉与交互 Spec 说明为了让前端开发能够无缝落地，该页面的核心交互与布局逻辑严格规整如下：
1. 👤 用户账户区（Account Block）未登录态（如上图所示）： 保持图二的心理施压策略，大字报高亮显示 Not signed in · Data lost if you change phones，紧贴亮色的 CONTINUE WITH GOOGLE。已登录态（影子翻转）： 登录后，该区域平滑缩回，展示图一的头像、John Contractor、以及代表已锁定资产的 2027 Tax Season · Paid ✓。
2. 📊 税务资产总览（Tax Overview）—— 留存强钩子紧贴登录框下方，保留图一的黑金微光高质感面板。三栏数字（Estimated Tax Saved / Receipts Tracked / Total Deductions）等宽排布，让工人进站第一眼就看到自己已经记录的刚性合规资产包，拉满即时获得感。
3.💳 $49 税季变现硬门控（Tax Export Gate）—— 刚性收网拒绝隐藏： 彻底废除图一藏在菜单深处的做法，将图二的通栏亮黄色大按钮 [ 🔒 EXPORT 2027 IRS TAX PACK ($49) ] 强行卡在资产总览的正下方。交互逻辑： * 匿名新用户点击 $\rightarrow$ 触发 D 方案：纯前端一秒吐出样例 CSV 并将状态机转为 COMPLETED。已登录未付费老用户点击 $\rightarrow$ 原地平滑拉起 $49 利益对冲天平弹窗。
4. 🔗 3人免单裂变面板（Share & Referral）移去各种花哨的彩框，统一使用极简深灰卡片作为底板。顶部常驻行动召唤文案："Tell a fellow 1099 contractor to get 1 Year Free"，将分享功能彻底包装成工友互助的“逃生后门”。
5.🛠️ 配置项下沉（Preferences & Privacy）将 Language（语言）、Your Industry（行业标签）、Notification（通知设置）等一年只用选一次的低频死数据，统一收纳进下方的折叠菜单或灰暗色小列表项中，绝不抢占首屏的商业黄金视线。