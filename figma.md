# E-Commerce Admin Dashboard - UI Design Specification

> Complete design system and page-by-page specification for generating a professional, production-ready admin dashboard UI.

---

## 1. Design System Foundation

### 1.1 Color Palette

#### Primary Colors
| Token                | Value            | HSL                  | Usage                                      |
|----------------------|------------------|----------------------|--------------------------------------------|
| `--primary`          | `#F97316`        | `24 100% 50%`        | CTA buttons, active sidebar, focus rings   |
| `--primary-hover`    | `#EA580C`        | `24 95% 48%`         | Button hover states                        |
| `--primary-light`    | `#FFF7ED`        | `24 100% 96%`        | Orange tinted backgrounds (`bg-orange-50`) |
| `--primary-muted`    | `#FDBA74`        | `24 95% 72%`         | Chips, soft badges                         |

#### Neutral / Gray Scale (Tailwind `gray-*`)
| Token             | Value       | Usage                                    |
|-------------------|-------------|------------------------------------------|
| `gray-50`         | `#F9FAFB`   | Page background, table header bg         |
| `gray-100`        | `#F3F4F6`   | Input group bg, subtle chips, dividers   |
| `gray-200`        | `#E5E7EB`   | Borders, card borders, table lines       |
| `gray-300`        | `#D1D5DB`   | Input borders, disabled state            |
| `gray-400`        | `#9CA3AF`   | Placeholder text, muted icons            |
| `gray-500`        | `#6B7280`   | Secondary text, sub-labels               |
| `gray-600`        | `#4B5563`   | Body text, back-link text                |
| `gray-700`        | `#374151`   | Table cell text, form values             |
| `gray-800`        | `#1F2937`   | Sidebar borders, dark accents            |
| `gray-900`        | `#111827`   | Sidebar background, page headings        |

#### Semantic Colors
| Purpose       | Background       | Text / Border     | Usage                              |
|---------------|------------------|--------------------|------------------------------------|
| Success       | `bg-green-100`   | `text-green-700`   | Active badges, stock high          |
| Warning       | `bg-yellow-100`  | `text-yellow-700`  | Pending status badge               |
| Danger        | `bg-red-100`     | `text-red-600`     | Delete buttons, out-of-stock       |
| Info          | `bg-blue-100`    | `text-blue-700`    | Category level badge, info notes   |
| Purple accent | `bg-purple-100`  | `text-purple-700`  | Shipped badge, register page       |
| Orange accent | `bg-orange-100`  | `text-orange-700`  | Processing badge, value chips      |

### 1.2 Typography

| Element             | Class                                           | Size     | Weight     |
|---------------------|-------------------------------------------------|----------|------------|
| Page title          | `text-2xl md:text-3xl font-bold text-gray-900`  | 24-30px  | 700 (Bold) |
| Section heading     | `text-lg font-semibold text-gray-900`           | 18px     | 600        |
| Table header        | `text-xs font-medium text-gray-500 uppercase tracking-wider` | 12px | 500  |
| Body text           | `text-sm text-gray-700`                         | 14px     | 400        |
| Label               | `text-sm font-medium text-gray-700`             | 14px     | 500        |
| Helper / Caption    | `text-xs text-gray-400`                         | 12px     | 400        |
| Monospace (SKU/ID)  | `font-mono text-gray-600 text-sm`               | 14px     | 400        |
| Back link           | `text-gray-600 hover:text-gray-900 text-sm`     | 14px     | 400        |

**Font Family:** System default (inherits from Tailwind + Next.js Geist font via `next/font`).

### 1.3 Spacing System

| Context              | Value               | Tailwind          |
|----------------------|---------------------|--------------------|
| Page padding         | 16px mobile / 32px  | `p-4 md:p-8`      |
| Section gap          | 24px                | `space-y-6`        |
| Card internal padding| 16px mobile / 24px  | `p-4 md:p-6`      |
| Form field gap       | 16px                | `gap-4`            |
| Label to input       | 8px                 | `mb-2`             |
| Header to content    | 24px mobile / 32px  | `mb-6 md:mb-8`     |
| Bottom safe area     | 112px               | `pb-28`            |

### 1.4 Border Radius

| Element               | Radius            | Tailwind        |
|------------------------|--------------------|-----------------|
| Cards / Panels         | 8px                | `rounded-lg`    |
| Order detail cards     | 12px               | `rounded-xl`    |
| Auth cards             | 16px               | `rounded-2xl`   |
| Buttons                | 8px                | `rounded-lg`    |
| Inputs                 | 8px                | `rounded-lg`    |
| Status badges          | 9999px (pill)      | `rounded-full`  |
| Value chips            | 9999px (pill)      | `rounded-full`  |
| Avatar circles         | 9999px             | `rounded-full`  |
| Sidebar icons / brand  | 8px                | `rounded-lg`    |
| Confirmation dialogs   | 16px               | `rounded-2xl`   |

### 1.5 Shadows & Elevation

| Level      | Class              | Usage                           |
|------------|--------------------|---------------------------------|
| Level 0    | No shadow          | Cards, tables (border only)     |
| Level 1    | `shadow-sm`        | Primary CTA buttons             |
| Level 2    | `shadow-lg`        | Sticky bottom action bar        |
| Level 3    | `shadow-xl`        | Auth form cards                 |
| Level 4    | `shadow-2xl`       | Confirmation modal dialogs      |

### 1.6 Transitions & Animations

| Type                  | Class / Style                                    |
|-----------------------|--------------------------------------------------|
| Button hover          | `transition` (150ms ease)                        |
| Sidebar link hover    | `transition` on background-color                 |
| Mobile drawer slide   | `transition-transform duration-300 ease-in-out`  |
| Loading spinner       | `animate-spin` on `border-b-2 border-orange-500` |
| Stock bar fill        | `transition-all duration-300`                    |
| Overlay fade-in       | `transition-opacity`                             |
| Row hover             | `hover:bg-gray-50 transition-colors`             |
| Delete staging        | `transition-all` (opacity + line-through)         |

---

## 2. Shared Components

### 2.1 Sidebar Navigation

**Desktop:** Fixed left, `w-64`, full viewport height, `bg-gray-900 text-white`.

```
+--------------------------------------+
|  [Orange-bg icon]  E-Commerce        |
|                    Admin Panel        |
|--------------------------------------|
|  [Avatar circle]  user@email.com     |
|                   Store Owner        |
|--------------------------------------|
|  icon  Dashboard          (active)   |  <- bg-orange-500 text-white rounded-lg
|  icon  Orders                        |  <- text-gray-300 hover:bg-gray-800
|  icon  Products                      |
|  icon  Catalogs                      |
|  icon  Stores                        |
|  icon  Categories                    |
|  icon  Attributes                    |
|--------------------------------------|
|  icon  Logout                        |  <- hover:bg-red-600
+--------------------------------------+
```

**Mobile:** Hidden by default. Topbar with hamburger. Drawer slides in from left (`w-72`, z-50), dark overlay behind.

- Brand: `w-10 h-10 bg-orange-500 rounded-lg` icon container
- User avatar: `w-9 h-9 bg-orange-500 rounded-full` with first letter of email
- Nav items: `px-4 py-3 rounded-lg`, `gap-3`, text icon + label
- Active state: `bg-orange-500 text-white`
- Inactive state: `text-gray-300 hover:bg-gray-800 hover:text-white`
- Logout: `hover:bg-red-600 hover:text-white`

### 2.2 DataTable

**Container:** `bg-white rounded-lg border border-gray-200 overflow-hidden`

**Structure:**
```
+----------------------------------------------------------+
|  HEADER 1         HEADER 2      HEADER 3    ACTIONS       |  <- bg-gray-50 border-b
|----------------------------------------------------------|
|  Cell content     Cell          Cell        [Delete btn]  |  <- hover:bg-gray-50
|  Cell content     Cell          Cell        [Delete btn]  |
|----------------------------------------------------------|
|  (empty state)                                            |
|           [box emoji]                                     |
|           No data available                               |
+----------------------------------------------------------+
```

- Table header: `px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`
- Table cell: `px-4 md:px-6 py-4 whitespace-nowrap text-sm`
- Row divider: `divide-y divide-gray-100`
- Clickable row: `cursor-pointer hover:bg-gray-50 transition-colors`
- Min-width: `min-w-[600px]` inside `overflow-x-auto`
- Sortable indicator: `arrow ↕` in `text-gray-400 ml-2`

**Loading state:** Centered `animate-spin` spinner (orange-500, h-12 w-12)

**Empty state:** Centered icon (`text-4xl`) + `text-sm text-gray-400` message

### 2.3 SearchBar

**Layout:** Full-width input with search icon overlay.

```
+------------------------------------------------------+
|  [magnifying glass icon]  Search by product name...  |
+------------------------------------------------------+
```

- Container: `flex-1 relative`
- Input: `w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm`
- Icon: `absolute left-3 top-3 w-5 h-5 text-gray-400` (SVG magnifying glass)
- Bottom margin: `mb-6`

### 2.4 StockIndicator

**Layout:** Progress bar + text below.

```
[========--------] <- colored bar on gray track
42 in stock        <- colored text

[================] <- green for high
[==========------] <- orange for medium
[===-------------] <- red for low
[                ] <- red "Out of stock"
```

- Track: `w-full h-2 rounded-full bg-{color}-100`
- Fill: `h-2 rounded-full bg-{color}-500 transition-all duration-300`
- Text: `text-xs font-semibold mt-1 text-{color}-700`
- Thresholds: 0 = red, 1-10 = red, 11-30 = orange, 31+ = green
- Max reference: 100 units for percentage calculation

### 2.5 MediaUploader

**Layout:** Drag-and-drop zone + media grid.

```
+---------------------------------------------------+
|  Product Media                                     |
|                                                    |
|  +-----------------------------------------------+|
|  |  (dashed border)                               ||
|  |         [image icon]                           ||
|  |  Drag & drop images/videos here, or browse    ||
|  |  PNG, JPG, WEBP, MP4 supported                ||
|  +-----------------------------------------------+|
|                                                    |
|  [img1] [img2] [img3] [img4]  <- 3-4 col grid    |
+---------------------------------------------------+
```

- Drop zone border: `border-2 border-dashed rounded-xl p-8`
- Normal: `border-gray-300 hover:border-orange-400 hover:bg-orange-50/40`
- Dragging: `border-orange-500 bg-orange-50`
- Grid: `grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5`
- Each tile: `aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50`
- Delete overlay: `absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100`

### 2.6 Sticky Bottom Action Bar

**Layout:** Fixed to bottom, leaves sidebar space on desktop.

```
+--[sidebar space]--------------------------------------------+
|                                      [Cancel]  [Save/Create]|
+-------------------------------------------------------------+
```

- Position: `fixed bottom-0 left-0 md:left-64 right-0 z-50`
- Style: `bg-white border-t border-gray-200 px-4 md:px-8 py-4 shadow-lg`
- Layout: `flex justify-end gap-3`
- Cancel: `px-5 md:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm`
- Primary: `px-6 md:px-8 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-sm text-sm`

### 2.7 Confirmation Dialog (Modal)

**Layout:** Centered modal with backdrop.

```
+--[dark backdrop bg-black/40]---------------------------+
|                                                         |
|    +-----------------------------------------------+   |
|    |  [red circle icon]  Delete Value?              |   |
|    |                     Changes apply after Save   |   |
|    |                                                |   |
|    |  Delete "Large"?                              |   |
|    |  The value won't be permanently removed...    |   |
|    |                                                |   |
|    |                [Cancel]  [Mark for Deletion]   |   |
|    +-----------------------------------------------+   |
+--------------------------------------------------------+
```

- Backdrop: `fixed inset-0 z-[60] bg-black/40`
- Dialog: `bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4`
- Icon container: `w-10 h-10 rounded-full bg-red-100` with delete emoji
- Title: `text-base font-semibold text-gray-900`
- Subtitle: `text-sm text-gray-500`
- Body: `text-gray-700` with `font-semibold text-red-600` for item name
- Caption: `text-xs text-gray-400`
- Cancel btn: `px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium`
- Confirm btn: `px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium`

### 2.8 Status Badges

| Status      | Background        | Text               | Border              |
|-------------|-------------------|---------------------|----------------------|
| Pending     | `bg-yellow-100`   | `text-yellow-700`   | `border-yellow-200`  |
| Confirmed   | `bg-blue-100`     | `text-blue-700`     | `border-blue-200`    |
| Processing  | `bg-orange-100`   | `text-orange-700`   | `border-orange-200`  |
| Shipped     | `bg-purple-100`   | `text-purple-700`   | `border-purple-200`  |
| Delivered   | `bg-green-100`    | `text-green-700`    | `border-green-200`   |
| Cancelled   | `bg-red-100`      | `text-red-600`      | `border-red-200`     |
| Active      | `bg-green-100`    | `text-green-700`    | -                    |
| Inactive    | `bg-red-100`      | `text-red-700`      | -                    |

**Badge style:** `px-3 py-1 rounded-full text-xs font-semibold capitalize`

### 2.9 Info Banner

**Layout:** Inline callout with icon.

```
+----------------------------------------------------+
| i  Stock was automatically reduced for each item   |
|    when this order was placed.                     |
+----------------------------------------------------+
```

- Container: `p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2`
- Icon: `text-blue-500 text-sm`
- Text: `text-xs text-blue-700`

---

## 3. Page Layouts

### 3.1 Overall Dashboard Layout

```
+--------+------------------------------------------------+
|        |                                                |
| SIDEBAR|  MAIN CONTENT AREA                             |
| w-64   |  bg-gray-50                                    |
| fixed  |  md:ml-64                                      |
| gray-900|  p-4 md:p-8                                   |
|        |                                                |
|        |                                                |
|        |                                                |
+--------+------------------------------------------------+
```

- Sidebar: Fixed left, `w-64`, `bg-gray-900`, full height
- Main: `flex-1 md:ml-64 min-w-0`, `bg-gray-50`
- Mobile: `pt-14` to clear fixed topbar

---

## 4. Page-by-Page Specification

### 4.1 Login Page (`/login`)

**Background:** `bg-gradient-to-br from-blue-50 to-indigo-100`

```
+------------------------------------------------------+
|                                                      |
|           +------------------------------+           |
|           |     [blue circle icon]       |           |
|           |     Welcome Back!            |           |
|           |     Sign in to manage stores |           |
|           |                              |           |
|           |  Email Address               |           |
|           |  [____________________]      |           |
|           |                              |           |
|           |  Password                    |           |
|           |  [____________________]      |           |
|           |                              |           |
|           |  [   Sign In   ]             |           |  <- bg-blue-600, full-width
|           |                              |           |
|           |  Don't have an account?      |           |
|           |  Create one now              |           |  <- text-blue-600 link
|           +------------------------------+           |
|                                                      |
+------------------------------------------------------+
```

- Card: `bg-white rounded-2xl shadow-xl p-8 max-w-md`
- Icon circle: `w-16 h-16 bg-blue-600 rounded-full`
- Title: `text-3xl font-bold text-gray-900 mb-2`
- Subtitle: `text-gray-500`
- Inputs: `px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`
- Submit: `w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700`
- Link: `text-blue-600 font-semibold hover:underline`

### 4.2 Register Page (`/register`)

**Background:** `bg-gradient-to-br from-purple-50 to-pink-100`

Same layout as Login with:
- Icon circle: `bg-purple-600`
- Focus ring: `focus:ring-purple-500`
- Submit: `bg-purple-600 hover:bg-purple-700`
- Link: `text-purple-600`
- Fields: Email, Username, Password, Confirm Password

### 4.3 List Pages (Products, Categories, Attributes, Stores, Catalogs)

**Shared layout pattern:**

```
+------------------------------------------------------+
|  Page Title                     [+ Add Button]       |
|                                                      |
|  [Search input with icon..........................]  |
|                                                      |
|  +--------------------------------------------------+
|  | HEADER1    HEADER2    HEADER3    HEADER4   ACT    |  <- bg-gray-50
|  |--------------------------------------------------|
|  | row data   data       data       data     [del]   |  <- hover:bg-gray-50
|  | row data   data       data       data     [del]   |
|  | row data   data       data       data     [del]   |
|  +--------------------------------------------------+
+------------------------------------------------------+
```

- Header row: `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6`
- Title: `text-2xl md:text-3xl font-bold text-gray-900`
- Add button: `px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 flex items-center gap-2`
  - Plus icon: `text-xl` "+"
- Delete button (in table): `px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm`

#### 4.3.1 Products List Columns
| Column    | Content                                                                              |
|-----------|--------------------------------------------------------------------------------------|
| NAME      | Product image thumbnail (40x40 md:48x48, rounded-lg) + name (font-semibold) + category (text-xs gray-500) |
| SERIAL    | SKU in `font-mono text-gray-600 text-sm`                                             |
| STOCK     | StockIndicator component (progress bar + text)                                       |
| CATALOG   | Orange circle counter `w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-bold` |
| PRICE     | `font-semibold text-gray-900` formatted with `.toLocaleString()`                     |
| Actions   | Delete button                                                                         |

#### 4.3.2 Categories List Columns
| Column    | Content                                              |
|-----------|------------------------------------------------------|
| NAME      | Indentation arrows + `font-semibold text-gray-900`   |
| SLUG      | `font-mono text-gray-500 text-sm`                    |
| LEVEL     | Pill badge: Main=blue, Sub=purple, Sub-Sub=orange    |
| PARENT    | `text-gray-500 text-sm`                              |
| PRODUCTS  | Circle counter `w-8 h-8 bg-gray-100 rounded-full`   |
| Actions   | Delete button                                         |

#### 4.3.3 Attributes List Columns
| Column     | Content                                                                   |
|------------|---------------------------------------------------------------------------|
| ATTRIBUTE  | `font-semibold text-gray-900`                                            |
| CATEGORY   | `px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium`        |
| VALUES     | Chip pills: `px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs` (max 5 shown, "+N more") |
| COUNT      | Circle counter                                                            |
| Actions    | Delete button                                                             |

#### 4.3.4 Stores List Columns
| Column      | Content                                                  |
|-------------|----------------------------------------------------------|
| STORE       | Blue bg icon (40x40) + name (font-semibold) + subdomain (text-xs text-blue-600) |
| DESCRIPTION | `text-gray-500 text-sm`                                  |
| CURRENCY    | `px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold` |
| STATUS      | Active/Inactive pill badge                               |
| Actions     | Delete button                                             |

#### 4.3.5 Orders List (with status tabs)
**Additional element: Status filter tabs**

```
+-------------------------------------------------------------------+
| [All] [Pending] [Confirmed] [Processing] [Shipped] [Delivered] [X]|
+-------------------------------------------------------------------+
```

- Container: `bg-white border border-gray-200 rounded-xl p-1 flex gap-1 w-max`
- Active tab: `bg-orange-500 text-white shadow-sm rounded-lg`
- Inactive tab: `text-gray-600 hover:bg-gray-100 rounded-lg`
- Tab sizing: `px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium`
- Scrollable on mobile: `overflow-x-auto`

**Columns:** ORDER # (mono bold), CUSTOMER (name + email), ITEMS (circle counter), TOTAL (bold), STATUS (badge), DATE (gray text)

#### 4.3.6 Catalogs List Columns
| Column  | Content                                                    |
|---------|------------------------------------------------------------|
| NAME    | Variant name (bold) + attribute key:value pairs below      |
| PRODUCT | Parent product name in gray                                |
| STOCK   | StockIndicator component                                   |
| PRICE   | `font-semibold text-gray-900`                              |
| Actions | Delete button                                               |

### 4.4 Create / Edit Form Pages

**Shared layout pattern:**

```
+------------------------------------------------------+
|  ← Back to [Resource]                                |
|  Page Title                                          |
|  Subtitle / description                              |
|                                                      |
|  +--------------------------------------------------+
|  |  Section Heading                                  |
|  |                                                   |
|  |  [Label]        [Label]                           |
|  |  [Input]        [Input]                           |
|  |                                                   |
|  |  [Label]        [Label]                           |
|  |  [Select]       [Input]                           |
|  +--------------------------------------------------+
|                                                      |
|  (more sections...)                                  |
|                                                      |
|  ====================================================|
|  [STICKY BAR]              [Cancel]  [Save/Create]   |
+------------------------------------------------------+
```

- Max-width: `max-w-4xl`
- Back button: `text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm` with "← Back to..."
- Card: `bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-4`
- Section title: `text-lg font-semibold text-gray-900`
- Form grid: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Input: `w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`
- Select: Same styling as input
- Textarea: Same styling, `rows={4}`
- Required indicator: `*` after label text
- Helper text: `text-xs text-gray-400 mt-1`
- Bottom safe area: `pb-28` to prevent content behind sticky bar

### 4.5 Product Create Page

**Sections:**
1. **Basic Information** - Name, SKU, Price, Compare at Price, Category (select), Product Type (select: Single/Catalog), Stock (only for single), Description (textarea)
2. **Select Attributes** (only when `product_type === 'catalog'` AND category selected) - Checkbox list of attributes with value preview chips

**Attribute selector item:**
```
+-------------------------------------------------------+
| [checkbox]  Size                                       |
|             [S] [M] [L] [XL] [XXL]   <- gray chips    |
+-------------------------------------------------------+
```

- Container: `p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer`
- Attribute name: `font-medium text-gray-900`
- Value chips: `px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs`
- Count overflow: `+N` chip

**Info box when attributes selected:**
- `p-3 bg-orange-50 border border-orange-200 rounded-lg`
- Text: `text-sm text-orange-800`

### 4.6 Product Edit Page

**Sections:**
1. **Basic Information** form (same fields as create minus description/product_type)
2. **Select Attribute Value** (only for catalog products) - attribute value selection with toggle for single/multi catalog mode
3. **Added Catalogs** - table of variants (new + existing)
4. **MediaUploader** component
5. **Sticky Action Bar**

**Attribute value selector:**
```
+-----------------------------------------------------------+
|  Select Attribute Value              Single Catalog [toggle]|
|                                                             |
|  Size                                                       |
|  (radio/checkbox)  S  |  (radio/checkbox)  M  | ...       |  <- border-2 rounded-lg
|                                                             |
|  Color                                                      |
|  (radio/checkbox)  Red  |  (radio/checkbox)  Blue  | ...  |
|                                                             |
|                                           [Add]            |
+-----------------------------------------------------------+
```

- Toggle switch: `relative inline-flex h-6 w-11 items-center rounded-full`
  - On: `bg-orange-500`, knob `translate-x-6`
  - Off: `bg-gray-300`, knob `translate-x-1`
- Value option: `px-4 py-2 border-2 rounded-lg cursor-pointer`
  - Selected: `border-orange-500 bg-orange-50`
  - Unselected: `border-gray-200 hover:border-gray-300`

**Variants table:**
- New rows: `bg-orange-50`
- Pending delete rows: `bg-red-50 opacity-60` with `line-through` text
- Out-of-stock rows: `bg-red-50`
- Inline editable stock/price inputs: `w-24/w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm`
- Actions: Save (orange, only when dirty), Delete (red border), Remove (for new), Restore (orange, for pending delete)

### 4.7 Category Create / Edit Pages

**Single section:** Category Information
- Fields: Name, Slug (auto-generated from name), Parent Category (select with indentation arrows)
- Info box when parent selected: `p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800`

### 4.8 Attribute Create Page

**Two sections:**
1. **Attribute Information** - Name, Category (select)
2. **Attribute Values** - Add input + chip display area

**Value input row:**
```
[Type a value and press Enter or Add........]  [+ Add]
```

**Values display area:**
```
+----------------------------------------------+
|  [S ×]  [M ×]  [L ×]  [XL ×]  [XXL ×]      |  <- bg-gray-50 rounded-lg p-4
+----------------------------------------------+
```

- Chips: `px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium`
- Remove button: `text-orange-400 hover:text-red-600 font-bold`
- Empty state: `p-4 bg-gray-50 rounded-lg text-center text-gray-400 text-sm`

### 4.9 Attribute Edit Page

Same as create, with:
- Existing values show with delete staging (click x -> confirmation dialog -> line-through + red chip)
- Pending delete chips: `bg-red-100 text-red-400 line-through opacity-60`
- Restore button: `↩` icon on pending chips
- Pending count badge: `px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full`
- Warning text: `text-xs text-red-500`
- Counter: `text-xs text-gray-400` showing "N active / N pending deletion"

### 4.10 Store Create / Edit Pages

**Single section:** Store Information
- Fields: Store Name, Currency (select: USD/EUR/GBP/INR), Subdomain (input + `.myplatform.com` suffix)
- Subdomain input: joined input with suffix
  ```
  +-----------------------------------+-------------------+
  |  mystore                          | .myplatform.com   |  <- bg-gray-50 border-l
  +-----------------------------------+-------------------+
  ```
- Description (textarea), Active toggle (checkbox)
- Edit page: Subdomain is read-only (bg-gray-50)

### 4.11 Order Detail Page (`/orders/[id]`)

**Two-column layout on desktop, stacked on mobile:**

```
+-------------------------------------------+-------------------+
|  ← Back to Orders                         |                   |
|  Order #123          [Status Badge]       |                   |
|  Placed on Feb 28, 2025                   |                   |
|                                           |                   |
|  +---------------------------------------+|  +--------------+|
|  | Order Items                           ||  | Customer     ||
|  | PRODUCT  VARIANT  QTY  PRICE  STOCK   ||  | [avatar] Name||
|  | item1    -        2    100    42      ||  | email        ||
|  | item2    Red-L    1    200    0       ||  | phone        ||
|  |                                       ||  +--------------+|
|  | [info banner: stock auto-reduced]     ||                   |
|  |                                       ||  +--------------+|
|  |                   Order Total         ||  | Update Status||
|  |                   $800                ||  | [select v]   ||
|  +---------------------------------------+|  | [Save Status]||
|                                           |  +--------------+|
|  +---------------------------------------+|                   |
|  | Notes                                 ||                   |
|  | Customer note text...                 ||                   |
|  +---------------------------------------+|                   |
+-------------------------------------------+-------------------+
```

- Grid: `grid grid-cols-1 lg:grid-cols-3 gap-6`
- Left: `lg:col-span-2 space-y-6`
- Right: `space-y-6`
- Cards: `bg-white rounded-xl border border-gray-200 p-4 md:p-6`
- Quantity display: quantity number + red badge `-N` (`text-xs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded`)
- Stock column: Skeleton loading (`h-4 w-8 bg-gray-200 animate-pulse rounded`), out-of-stock badge, or colored number
- Customer avatar: `w-10 h-10 bg-orange-100 rounded-full text-orange-600 font-bold`
- Total: `text-2xl font-bold text-gray-900`
- Status select: Standard input styling
- Save Status button: Full-width orange button

---

## 5. Responsive Breakpoints

| Breakpoint | Tailwind | Behavior                                |
|------------|----------|-----------------------------------------|
| < 768px    | Default  | Single column, stacked layout, hamburger menu, pt-14 for topbar |
| >= 768px   | `md:`    | Sidebar visible, ml-64 offset, 2 columns in form grids |
| >= 1024px  | `lg:`    | 3-column grid on order detail page      |
| >= 640px   | `sm:`    | Flex-row for header (title + button), 2-col form grids |

### Mobile-specific patterns:
- Sidebar becomes slide-in drawer (`translate-x-0/-full`, `w-72`, z-50)
- Topbar: `fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white px-4 py-3`
- Tables: `overflow-x-auto` with `min-w-[600px]`
- Sticky action bar: `left-0` (no sidebar offset)
- Forms: Single column (`grid-cols-1`)
- Buttons: `self-start` instead of right-aligned

---

## 6. Interactive States Reference

### Buttons
| State      | Primary (Orange)                    | Secondary (Border)              | Danger (Red)                    |
|------------|-------------------------------------|---------------------------------|---------------------------------|
| Default    | `bg-orange-500 text-white`          | `border border-gray-300 text-gray-700` | `bg-red-50 text-red-600`     |
| Hover      | `bg-orange-600`                     | `bg-gray-50`                    | `bg-red-100`                   |
| Disabled   | `opacity-50 cursor-not-allowed`     | `opacity-50`                    | -                               |
| Loading    | Text changes to "Saving..." etc.    | -                               | -                               |

### Form Inputs
| State      | Style                                                    |
|------------|----------------------------------------------------------|
| Default    | `border border-gray-300`                                 |
| Focus      | `focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent` |
| Disabled   | `disabled:opacity-40 disabled:cursor-not-allowed`        |

### Table Rows
| State         | Style                                                |
|---------------|------------------------------------------------------|
| Default       | `bg-white`                                           |
| Hover         | `hover:bg-gray-50 transition-colors`                 |
| Clickable     | `cursor-pointer`                                     |
| New (unsaved) | `bg-orange-50`                                       |
| Pending delete| `bg-red-50 opacity-60` + `line-through` on text      |
| Out of stock  | `bg-red-50`                                          |

### Chip / Tag States
| State         | Style                                                |
|---------------|------------------------------------------------------|
| Default       | `bg-orange-100 text-orange-800 rounded-full`         |
| Pending delete| `bg-red-100 text-red-400 line-through opacity-60`    |
| Inactive      | `bg-gray-100 text-gray-700 rounded-full`             |

---

## 7. API Data Contracts

### Endpoints consumed by Frontend

| Page                  | APIs Used                                          |
|-----------------------|----------------------------------------------------|
| Login                 | `POST /api/auth/login/`                            |
| Register              | `POST /api/auth/register/`                         |
| Products List         | `GET /api/products/`, `GET /api/products/categories/` |
| Product Create        | `POST /api/products/`, `GET /api/products/categories/`, `GET /api/attributes/category/{id}/`, `POST /api/products/{id}/select_attributes/` |
| Product Edit          | `GET /api/products/{id}/`, `PUT /api/products/{id}/`, `POST /api/products/{id}/generate_catalog/`, `POST /api/products/{id}/upload_media/`, `PATCH /api/products/{id}/variants/{vid}/`, `DELETE /api/products/{id}/variants/{vid}/delete/` |
| Categories List       | `GET /api/products/categories/`                    |
| Category Create/Edit  | `POST/PUT /api/products/categories/{id}/`          |
| Attributes List       | `GET /api/attributes/`, `GET /api/products/categories/` |
| Attribute Create      | `POST /api/attributes/`, `POST /api/attributes/{id}/add_bulk_values/` |
| Attribute Edit        | `GET/PUT /api/attributes/{id}/`, `POST /api/attributes/{id}/add_value/`, `DELETE /api/attributes/{id}/values/{vid}/` |
| Stores List           | `GET /api/tenant/stores/`                          |
| Store Create/Edit     | `POST/PUT /api/tenant/stores/{id}/`                |
| Orders List           | `GET /api/orders/?status={status}`                 |
| Order Detail          | `GET /api/orders/{id}/`, `PATCH /api/orders/{id}/status/`, `GET /api/products/{id}/` (for stock) |
| Catalogs List         | `GET /api/products/`, `GET /api/products/{id}/` (per catalog product) |

---

## 8. Tech Stack & Libraries

| Library                  | Version    | Purpose                              |
|--------------------------|------------|--------------------------------------|
| Next.js                  | 16.1.6     | React framework (App Router)         |
| React                    | 19.x       | UI library                           |
| Tailwind CSS             | 4.x        | Utility-first CSS                    |
| shadcn/ui (new-york)     | Latest     | Radix-based component primitives     |
| Zustand                  | 5.x        | Auth state management (persisted)    |
| Axios                    | 1.9.x      | HTTP client with interceptors        |
| Sonner                   | 2.x        | Toast notifications (top-right)      |
| Lucide React             | 0.511.x    | Icon library                         |
| React Hook Form          | 7.x        | Form handling (available, not all pages use it yet) |
| Zod                      | 3.x        | Schema validation (available)        |
| TanStack React Query     | 5.x        | Data fetching/caching (available)    |
| class-variance-authority | 0.7.x      | Component variant styling            |
| clsx + tailwind-merge    | Latest     | Class name utilities (`cn()`)        |

---

## 9. Key UX Patterns

1. **Staged Deletion**: Items marked for deletion show `line-through`, `opacity-60`, red background. Actual deletion only fires on "Save Changes". Users can undo with a restore button. This pattern is used for attribute values AND product variants.

2. **Optimistic Navigation**: After successful create/update, `router.push()` redirects to list page immediately.

3. **Toast Notifications**: Success = green, Error = red, Info = blue. Positioned `top-right` with `richColors`.

4. **Loading Spinner**: Consistent orange-themed spinner: `animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500`.

5. **Auth Guard**: Every dashboard page checks `useAuthStore` for user. If absent, redirects to `/login`. Shows spinner while checking.

6. **Form ID Linking**: Forms use `id="create-{resource}-form"` / `id="edit-{resource}-form"` linked to submit button via `form=` attribute. This allows the submit button to live in the sticky action bar outside the `<form>` tag.

7. **Search Filtering**: Client-side filtering via `useState` + `.filter()`. No debounce, instant results.

8. **Responsive Tables**: All tables wrapped in `overflow-x-auto` with `min-w-[600px]` to prevent cramped layouts on mobile.
