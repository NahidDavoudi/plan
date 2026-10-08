import json
import os

def escape_sql_string(text):
    """برای جلوگیری از خطای سینتکس در SQL، کوتیشن‌ها را اسکیپ می‌کند"""
    if text is None:
        return ""
    return text.replace("'", "''")

def process_json(input_file, output_file):
    # خواندن فایل JSON
    if not os.path.exists(input_file):
        print(f"خطا: فایل {input_file} پیدا نشد!")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"خطا در فرمت JSON: {e}")
            return

    # دیکشنری موقت برای نگهداری اطلاعات نودها
    nodes = {}
    
    # مرحله 1: استخراج اطلاعات پایه هر نود
    # اصلاح متغیرها در حلقه
    for node_id_str, node_data in data.items():
        node_id = int(node_id_str)  # <-- خطای اینجا رفع شد
        nodes[node_id] = {
            'id': node_id,
            'label': node_data.get('label', ''),
            'level': node_data.get('level', 0),
            'parent_id': None,  # به صورت پیش‌فرض پدر ندارد (برای root)
            'order_index': node_data.get('order', 0)
        }

    # مرحله 2: محاسبه parent_id با استفاده از آرایه children
    for node_id_str, node_data in data.items():
        parent_id = int(node_id_str)
        children = node_data.get('children', [])
        
        if children:
            for index, child_id in enumerate(children):
                # اگر فرزند در لیست نودها وجود داشت، آیدی پدر را به آن می‌دهیم
                if child_id in nodes:
                    nodes[child_id]['parent_id'] = parent_id
                    # ترتیب قرارگیری در آرایه children را به عنوان order_index ذخیره می‌کنیم
                    nodes[child_id]['order_index'] = index
                else:
                    print(f"هشدار: فرزند با آیدی {child_id} در لیست اصلی پیدا نشد!")

    # مرحله 3: ساخت فایل SQL برای ایمپورت در دیتابیس
    with open(output_file, 'w', encoding='utf-8') as f:
        # نوشتن هدر فایل SQL
        f.write("-- اسکریپت تولید شده توسط پایتون\n")
        f.write("-- تاریخ تولید: خودکار\n\n")
        
        # ساخت جدول (اگر قبلا نساخته اید این خط جدول را می‌سازد)
        f.write("""CREATE TABLE IF NOT EXISTS curriculum_nodes (
    id INT PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    level INT NOT NULL,
    parent_id INT DEFAULT NULL,
    order_index INT DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES curriculum_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n""")
        
        # غیرفعال کردن بررسی کلیدهای خارجی موقتا برای سرعت بخشیدن به ایمپورت
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
        
        # خالی کردن جدول اگر قبلا داده داشت (اختیاری)
        f.write("TRUNCATE TABLE curriculum_nodes;\n\n")

        # درج داده‌ها
        for node_id in sorted(nodes.keys()):
            node = nodes[node_id]
            label_escaped = escape_sql_string(node['label'])
            parent_id_val = "NULL" if node['parent_id'] is None else str(node['parent_id'])
            
            sql = f"INSERT INTO curriculum_nodes (id, label, level, parent_id, order_index) VALUES ({node['id']}, '{label_escaped}', {node['level']}, {parent_id_val}, {node['order_index']});\n"
            f.write(sql)
        
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")
        print(f"موفقیت آمیز بود! فایل {output_file} ساخته شد.")

# اجرای اسکریپت
if __name__ == "__main__":
    input_filename = 'lernito_topic_tree.json'
    output_filename = 'import.sql'
    process_json(input_filename, output_filename)