#!/usr/bin/env python3
"""
自动统计在读学生第一作者论文并写入 students_2.md
用法: python update_student_pubs.py
"""

import re
from pathlib import Path
from collections import defaultdict

def parse_bib_file(bib_path):
    """解析 bib 文件，返回 {first_author: [abbr, ...]} 的映射"""
    with open(bib_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    author_venues = defaultdict(list)
    
    # 匹配每个 bib 条目
    entries = re.findall(r'@\w+\{[^,]+,(.+?)\n\}', content, re.DOTALL)
    
    for entry in entries:
        first_author_match = re.search(r'first_author\s*=\s*\{([^}]+)\}', entry)
        abbr_match = re.search(r'abbr\s*=\s*\{([^}]+)\}', entry)
        
        if first_author_match and abbr_match:
            author = first_author_match.group(1).strip()
            abbr = abbr_match.group(1).strip()
            author_venues[author].append(abbr)
    
    return author_venues

def count_publications(venues_list):
    """统计每个会议/期刊的数量，返回 [(abbr, count), ...]"""
    counts = defaultdict(int)
    for venue in venues_list:
        counts[venue] += 1
    # 按数量降序排列
    return sorted(counts.items(), key=lambda x: -x[1])

def update_students_md(md_path, author_venues):
    """更新 students_2.md 文件"""
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    current_pinyin = None
    in_front_matter = False
    front_matter_count = 0
    skip_publications = False
    
    for line in lines:
        stripped = line.strip()
        
        # 检测 front matter
        if stripped == '---':
            front_matter_count += 1
            if front_matter_count == 1:
                in_front_matter = True
                new_lines.append(line)
                continue
            elif front_matter_count == 2:
                # 处理最后一个学生
                if current_pinyin:
                    pubs = author_venues.get(current_pinyin, [])
                    if pubs:
                        pub_counts = count_publications(pubs)
                        new_lines.append('    publications:\n')
                        for abbr, count in pub_counts:
                            new_lines.append(f'      - {abbr}×{count}\n')
                    else:
                        new_lines.append('    publications: []\n')
                new_lines.append(line)
                continue
        
        if not in_front_matter or front_matter_count >= 2:
            new_lines.append(line)
            continue
        
        # 在 front matter 内处理
        # 检测 pinyin 字段
        pinyin_match = re.match(r'\s+pinyin:\s*(.+)', line)
        if pinyin_match:
            current_pinyin = pinyin_match.group(1).strip()
            new_lines.append(line)
            skip_publications = False
            continue
        
        # 检测是否是新的学生条目（以 "  - name:" 开头）
        if re.match(r'\s+- name:', line):
            # 如果前面有 pinyin，先添加 publications
            if current_pinyin:
                pubs = author_venues.get(current_pinyin, [])
                if pubs:
                    pub_counts = count_publications(pubs)
                    new_lines.append('    publications:\n')
                    for abbr, count in pub_counts:
                        new_lines.append(f'      - {abbr}×{count}\n')
                else:
                    new_lines.append('    publications: []\n')
            current_pinyin = None
            skip_publications = False
            new_lines.append(line)
            continue
        
        # 跳过已有的 publications 字段
        if re.match(r'\s+publications:', line):
            skip_publications = True
            continue
        
        if skip_publications:
            # 跳过 publications 的子项
            if re.match(r'\s+- ', line):
                continue
            else:
                skip_publications = False
        
        new_lines.append(line)
    
    return ''.join(new_lines)

def main():
    base_dir = Path(__file__).parent.parent
    bib_path = base_dir / '_bibliography' / 'papers.bib'
    md_path = base_dir / '_students' / 'students_2.md'
    
    if not bib_path.exists():
        print(f"错误: 找不到 {bib_path}")
        return
    
    if not md_path.exists():
        print(f"错误: 找不到 {md_path}")
        return
    
    print(f"正在解析 {bib_path}...")
    author_venues = parse_bib_file(bib_path)
    print(f"找到 {len(author_venues)} 位第一作者")
    
    print(f"正在更新 {md_path}...")
    new_content = update_students_md(md_path, author_venues)
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    # 打印统计结果
    print("\n统计结果:")
    print("-" * 40)
    
    # 重新读取文件提取学生信息
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    students = re.findall(r'- name:\s*(.+)\n\s+pinyin:\s*(.+)', content)
    
    for name, pinyin in students:
        pubs = author_venues.get(pinyin.strip(), [])
        if pubs:
            pub_counts = count_publications(pubs)
            pub_str = ', '.join([f"{abbr}×{count}" for abbr, count in pub_counts])
            print(f"{name} ({pinyin.strip()}): {pub_str}")
        else:
            print(f"{name} ({pinyin.strip()}): 无")
    
    print("-" * 40)
    print("完成！")

if __name__ == '__main__':
    main()
