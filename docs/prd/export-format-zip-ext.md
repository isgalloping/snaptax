### 图片文件名命名规范（关键核心）

图片绝对不能使用类似 `UUID.jpg` 或 `WhatsApp_Image.jpeg` 这样的无意义命名。必须采用 AI 识别出的关键数据逆向拼接命名，公式如下：

$$\text{文件名} = \text{日期(YYYYMMDD)} + \text{\_} + \text{商户名(Merchant)} + \text{\_} + \text{金额(\$Amount)} + \text{\_} + \text{序号(Index)} + \text{.扩展名}$$

**规范细节要求：**
* **去除特殊字符：** 商户名若包含空格、点、特殊符号（如 `H&M`，`Lowe's`），技术端需要统一过滤为下划线或删去（如 `Home_Depot` 或 `Lowes`）。
* **金额带上符号：** 文件名里直接带上 `$75.50`。审计员在不打开图片的情况下，只看文件名就能把总额对齐。
* **末尾三位 Index：** 必须与 `2025_Tax_Report_Summary.pdf` 附页中的 `Image Ref`（图片索引号）完全一致，实现精准交叉索引。

---

### 3. 数据报告（CSV/PDF）中的穿透映射

为了实现交叉验证，在导出的 **CSV 报告** 和 **PDF 附页流水** 中，必须有一列明确指向该图片在压缩包中的相对路径：

#### 📄 CSV 导出中的数据对齐示例：

| Date | Category | Merchant | Amount | Memo | Audit_Image_Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2025-12-14 | Line 9 - Car Expenses | Shell Gas | 75.50 | Truck Fuel | `Line_09_Car_and_truck_expenses/20250214_Shell_Gas_$75.50_001.jpg` |
| 2025-10-25 | Line 22 - Supplies | Home Depot | 340.00 | DeWalt Drill | `Line_22_Supplies/20251025_HomeDepot_$340.00_004.jpg` |